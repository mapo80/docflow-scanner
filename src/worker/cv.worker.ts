/// <reference lib="webworker" />
import type { WorkerIn, WorkerOut, PreviewAnalysis, FinalDocument } from './types'
import { polygonArea, centroid } from '../utils/geometry'
import thresholds from '../config/quality-thresholds.json'
import featureFlags from '../config/feature-flags.json'
import { classifyDocument } from './docType'
import { decide } from './decision'

let cvReady = false
let gPolicies: { thresholds: any, adaptive: any, features: any } = { thresholds: {}, adaptive: {}, features: {} }
let lastPoly: any = null

function post(msg: WorkerOut) { ;(self as any).postMessage(msg) }
function log(s: string) { post({ type: 'log', data: s }) }

async function loadOpenCV(engineLocation: string) {
  if ((self as any).cv) { cvReady = true; return }
  await new Promise<void>((resolve, reject) => {
    const script = (self as any).document?.createElement('script')
    if (script) {
      script.src = engineLocation + 'opencv.js'
      script.onload = () => resolve()
      script.onerror = e => reject(e)
      ;(self as any).document.head.appendChild(script)
    } else {
      importScripts(engineLocation + 'opencv.js')
      resolve()
    }
  })
  await new Promise<void>((resolve) => {
    const check = () => { if ((self as any).cv && (self as any).cv.imread) resolve(); else setTimeout(check, 50) }
    check()
  })
  cvReady = true
  log('OpenCV loaded')
}

function toMatFromBitmap(bitmap: ImageBitmap): any {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  const cv: any = (self as any).cv
  return cv.matFromImageData(imgData)
}

async function blobToMat(blob: Blob): Promise<any> {
  const bmp = await createImageBitmap(blob)
  return toMatFromBitmap(bmp)
}

function detectQuad(mat: any): { polygon: { x:number,y:number }[] | null, edges: any, gray: any } {
  const cv: any = (self as any).cv
  const gray = new cv.Mat()
  cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)
  const blur = new cv.Mat()
  cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0)
  const edges = new cv.Mat()
  cv.Canny(blur, edges, 50, 150)
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
  let best: any = null
  let bestArea = 0
  for (let i=0;i<contours.size();i++) {
    const cnt = contours.get(i)
    const peri = cv.arcLength(cnt, true)
    const approx = new cv.Mat()
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true)
    if (approx.rows === 4) {
      const area = cv.contourArea(approx)
      if (area > 0.1 * mat.rows * mat.cols && area > bestArea) {
        best?.delete?.()
        best = approx
        bestArea = area
      } else {
        approx.delete()
      }
    } else {
      approx.delete()
    }
  }
  let poly = null
  if (best) {
    poly = []
    for (let i=0;i<best.rows;i++) {
      const p = best.intPtr(i,0)
      poly.push({ x: p[0], y: p[1] })
    }
    best.delete()
  }
  hierarchy.delete(); contours.delete(); blur.delete()
  return { polygon: poly, edges, gray }
}

function glarePctInPolygon(gray: any, poly: {x:number,y:number}[], threshVal=250): number {
  const cv: any = (self as any).cv
  const mask = new cv.Mat.zeros(gray.rows, gray.cols, cv.CV_8UC1)
  const ptsData = poly.flatMap(p => [p.x, p.y])
  const ptsMat = cv.matFromArray(poly.length, 1, cv.CV_32SC2, ptsData)
  const pts = new cv.MatVector()
  pts.push_back(ptsMat)
  cv.fillPoly(mask, pts, new cv.Scalar(255,255,255,255))
  const bright = new cv.Mat()
  cv.threshold(gray, bright, threshVal, 255, cv.THRESH_BINARY)
  const masked = new cv.Mat()
  cv.bitwise_and(bright, mask, masked)
  const brightCount = cv.countNonZero(masked)
  const maskCount = cv.countNonZero(mask)
  mask.delete(); pts.delete(); ptsMat.delete(); bright.delete(); masked.delete()
  return maskCount ? (brightCount / maskCount) * 100 : 0
}

function computeQuality(mat: any, poly: any[] | null, edges: any): any {
  const cv: any = (self as any).cv
  const w = mat.cols, h = mat.rows
  const areaFrame = w*h
  let coveragePct = 0
  let centerOffsetPct = 100
  let aspectRatio = 0
  let perspectiveTiltDeg = 0
  let glarePct = 0
  let blurScore = 0

  if (poly) {
    const a = polygonArea(poly)
    coveragePct = a / areaFrame * 100
    const c = centroid(poly)
    const dx = (c.x - w/2) / w
    const dy = (c.y - h/2) / h
    centerOffsetPct = Math.hypot(dx, dy) * 100
    const wlen = Math.hypot(poly[1].x-poly[0].x, poly[1].y-poly[0].y)
    const hlen = Math.hypot(poly[3].x-poly[0].x, poly[3].y-poly[0].y)
    aspectRatio = wlen / (hlen || 1)
    // Glare based on grayscale
    const gray = new cv.Mat()
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)
    glarePct = glarePctInPolygon(gray, poly, 250)
    gray.delete()
  }

  // Blur: fraction of strong edges (heuristic normalization)
  if (edges) {
    const total = edges.rows * edges.cols
    const nz = cv.countNonZero(edges)
    blurScore = Math.min(1, nz / (total*0.15))
    edges.delete()
  }

  const thr: any = thresholds
  let decision: any = 'WAITING'
  if (blurScore < thr.blurMin) decision = 'TOO_BLURRY'
  else if (coveragePct < thr.coveragePctMin) decision = 'MOVE_CLOSER'
  else if (centerOffsetPct > thr.centerOffsetPctMax) decision = 'MOVE_CLOSER'
  else if (glarePct > thr.glarePctMax) decision = 'BAD_LIGHT'
  else decision = 'READY_TO_CAPTURE'

  // stability (naive) using first point motion
  let stabilityScore = 0
  if (poly && lastPoly) {
    const dc = Math.hypot(poly[0].x - lastPoly[0].x, poly[0].y - lastPoly[0].y) / Math.max(w,h)
    stabilityScore = Math.max(0, 1 - dc*10)
  }
  if (poly) lastPoly = poly

  return {
    quality: { blurScore, glarePct, coveragePct, centerOffsetPct, aspectRatio, perspectiveTiltDeg, stabilityScore },
    decision
  }
}

function orderQuad(poly: {x:number,y:number}[]) {
  // Order: TL, TR, BR, BL
  const pts = poly.slice()
  pts.sort((a,b) => a.y === b.y ? a.x - b.x : a.y - b.y)
  const [p0, p1, p2, p3] = pts
  // heuristic: left-most of top two is TL
  const top = [p0, p1].sort((a,b)=>a.x-b.x)
  const bot = [p2, p3].sort((a,b)=>a.x-b.x)
  return [top[0], top[1], bot[1], bot[0]]
}

function warpDocument(src: any, poly: {x:number,y:number}[]) {
  const cv: any = (self as any).cv
  const [tl,tr,br,bl] = orderQuad(poly)
  const widthTop = Math.hypot(tr.x-tl.x, tr.y-tl.y)
  const widthBottom = Math.hypot(br.x-bl.x, br.y-bl.y)
  const maxW = Math.max(widthTop, widthBottom)
  const heightLeft = Math.hypot(bl.x-tl.x, bl.y-tl.y)
  const heightRight = Math.hypot(br.x-tr.x, br.y-tr.y)
  const maxH = Math.max(heightLeft, heightRight)
  const dstW = Math.max( Math.round(maxW), 100 )
  const dstH = Math.max( Math.round(maxH), 100 )
  const srcTri = cv.matFromArray(4,1,cv.CV_32FC2, new Float32Array([tl.x,tl.y, tr.x,tr.y, br.x,br.y, bl.x,bl.y]))
  const dstTri = cv.matFromArray(4,1,cv.CV_32FC2, new Float32Array([0,0, dstW,0, dstW,dstH, 0,dstH]))
  const M = cv.getPerspectiveTransform(srcTri, dstTri)
  const dst = new cv.Mat()
  cv.warpPerspective(src, dst, M, new cv.Size(dstW, dstH), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
  srcTri.delete(); dstTri.delete(); M.delete()
  return dst
}

function postProcess(src: any, force?: boolean) {
  const cv: any = (self as any).cv
  const enable = force ?? !!(gPolicies?.features?.enablePostProcessing)
    if (!enable) return src
  const gray = new cv.Mat()
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
  const clahe = new cv.CLAHE(2.0, new cv.Size(8,8))
  clahe.apply(gray, gray)
  const out = new cv.Mat()
  cv.adaptiveThreshold(gray, out, 255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 35, 10)
  gray.delete(); clahe.delete()
  return out
}

async function handlePreview(bitmap: ImageBitmap) {
  if (!cvReady) return post({ type:'analysis', data: emptyAnalysis(0,0) })
  const t0 = performance.now()
  const mat = toMatFromBitmap(bitmap)
  const t1 = performance.now()
  const { polygon, edges, gray } = detectQuad(mat)
  const t2 = performance.now()
  const { quality, decision } = computeQuality(mat, polygon, edges)
  gray.delete()
  const t3 = performance.now()
  mat.delete()
  const analysis: PreviewAnalysis = {
    polygon: polygon as any,
    quality,
    decision,
    perf: { toMat: t1-t0, detect: t2-t1, score: t3-t2 }
  }
  post({ type: 'analysis', data: analysis })
}

function emptyAnalysis(w:number,h:number): PreviewAnalysis {
  return {
    polygon: null,
    quality: { blurScore: 0, glarePct: 0, coveragePct: 0, centerOffsetPct: 100, aspectRatio: 0, perspectiveTiltDeg: 0, stabilityScore: 0 },
    decision: 'WAITING',
    perf: {}
  }
}

async function handleWarp(blob: Blob, polygon: any, postProcessFlag?: boolean) {
  const cv: any = (self as any).cv
  const t0 = performance.now()
  const src = await blobToMat(blob)
  const t1 = performance.now()
  const warped = warpDocument(src, polygon)
  const t2 = performance.now()
  const processed = postProcess(warped, postProcessFlag)
  const t3 = performance.now()

  // encode to JPEG using canvas
  const canvas = new OffscreenCanvas(processed.cols, processed.rows)
  const ctx = canvas.getContext('2d')!
  // Convert Mat to ImageData
  let outRGBA = processed
  if (processed.type() !== cv.CV_8UC4) {
    const tmp = new cv.Mat()
    if (processed.channels() === 1) cv.cvtColor(processed, tmp, cv.COLOR_GRAY2RGBA)
    else cv.cvtColor(processed, tmp, cv.COLOR_RGBA2RGBA)
    outRGBA = tmp
  }
  const imgData = new ImageData(new Uint8ClampedArray(outRGBA.data), outRGBA.cols, outRGBA.rows)
  ctx.putImageData(imgData, 0, 0)
  const blobOut = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })

  src.delete(); warped.delete(); if (outRGBA !== processed) outRGBA.delete(); processed.delete()
  const t4 = performance.now()

  const arr = await blobOut.arrayBuffer()
  const final: FinalDocument = {
    image: arr,
    postproc: { clahe: !!featureFlags.enablePostProcessing, denoise: false, adaptiveThreshold: !!featureFlags.enablePostProcessing },
    meta: { width: canvas.width, height: canvas.height, pipelineTimings: { load: t1-t0, warp: t2-t1, post: t3-t2, encode: t4-t3 } }
  }
  post({ type: 'final', data: final })
}

self.onmessage = async (e: MessageEvent<WorkerIn>) => {
  const msg = e.data
  if (msg.type === 'init') {
      gPolicies = msg.policies
    await loadOpenCV(msg.engineLocation)
    post({ type: 'log', data: 'init done' })
    post({ type: 'analysis', data: emptyAnalysis(0,0) })
  } else if (msg.type === 'preview') {
    await handlePreview(msg.bitmap)
  } else if (msg.type === 'updatePolicies') {
      gPolicies = msg.policies
      post({ type: 'log', data: 'policies updated' })
    } else if (msg.type === 'warp') {
    await handleWarp(msg.blob, msg.polygon as any, msg.postProcess)
  } else if (msg.type === 'dispose') {
    // noop
  }
}
