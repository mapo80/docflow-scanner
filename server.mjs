import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const dist = path.join(__dirname, 'dist')

app.use((req,res,next) => {
  res.setHeader('Cross-Origin-Opener-Policy','same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp')
  next()
})
app.use(express.static(dist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.wasm') || filePath.endsWith('.js')) {
      res.setHeader('Cross-Origin-Resource-Policy','cross-origin')
    }
  }
}))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`[server] listening on :${port}`))
