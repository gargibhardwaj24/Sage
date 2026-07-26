export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withRetry(work, attempts = 3, base = 400) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await work()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) await delay(base * (i + 1))
    }
  }
  throw lastError
}
