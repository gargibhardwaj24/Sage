import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve(process.cwd(), 'src')

const tryFiles = (base) => {
  for (const candidate of [base, `${base}.js`, `${base}.jsx`, path.join(base, 'index.js')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true }
    }
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const hit = tryFiles(path.join(SRC, specifier.slice(2)))
    if (hit) return hit
  }
  if (specifier.startsWith('.') && !path.extname(specifier) && context.parentURL) {
    const parentDir = path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
    const hit = tryFiles(path.resolve(decodeURIComponent(parentDir), specifier))
    if (hit) return hit
  }
  return nextResolve(specifier, context)
}
