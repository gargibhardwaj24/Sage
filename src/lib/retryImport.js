import { logDev } from '@/lib/errors'

const RELOAD_FLAG = 'sage.chunk-reload'

export function retryImport(factory, attempts = 3, delay = 350) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      factory()
        .then((module) => {
          sessionStorage.removeItem(RELOAD_FLAG)
          resolve(module)
        })
        .catch((error) => {
          if (remaining > 1) {
            logDev('chunk', `retrying import (${remaining - 1} left): ${error?.message ?? error}`)
            setTimeout(() => attempt(remaining - 1), delay)
            return
          }

          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, '1')
            logDev('chunk', 'stale chunk after retries — reloading once')
            window.location.reload()
            return
          }

          reject(error)
        })
    }

    attempt(attempts)
  })
}
