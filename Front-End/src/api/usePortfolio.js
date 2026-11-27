import { useEffect, useState } from 'react'

export function usePortfolio(load, ...args) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ loading: true })
  const [first, second, third] = args
  useEffect(() => {
    const controller = new AbortController()
    const params = third === undefined ? [first, second] : [first, second, third]
    load(...params, controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ data }) },
      (error) => { if (!controller.signal.aborted) setResult({ error: error.message }) },
    )
    return () => controller.abort()
  }, [load, first, second, third, version])

  function reload() {
    setResult({ loading: true })
    setVersion((value) => value + 1)
  }
  return { ...result, reload }
}