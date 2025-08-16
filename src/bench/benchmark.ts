export function runBenchmark(startTime: number, durationMs: number, getAnalysis: () => any) {
  const samples: { t:number, perf:any }[] = []
  function tick() {
    const a = getAnalysis()
    if (a?.perf) samples.push({ t: performance.now(), perf: a.perf })
    if (performance.now() - startTime < durationMs) requestAnimationFrame(tick)
    else {
      const m = (k:string) => samples.map(s => Number(s.perf?.[k] || 0)).filter(x=>x>0)
      const avg = (arr:number[]) => arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0
      const res = {
        toMatAvg: avg(m('toMat')),
        detectAvg: avg(m('detect')),
        scoreAvg: avg(m('score')),
        n: samples.length
      }
      console.log('[benchmark]', res)
      try { localStorage.setItem('scanner-benchmark', JSON.stringify(res)) } catch {}
      const ev = new CustomEvent('benchmark:done', { detail: res })
      window.dispatchEvent(ev)
    }
  }
  requestAnimationFrame(tick)
}
