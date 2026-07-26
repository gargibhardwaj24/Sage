import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [state, setState] = useState({ open: false, event: null, draft: null })

  const openNew = useCallback((draft = null) => setState({ open: true, event: null, draft }), [])
  const openEdit = useCallback((event) => setState({ open: true, event, draft: null }), [])
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  const value = useMemo(() => ({ ...state, openNew, openEdit, close }), [state, openNew, openEdit, close])

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export function useEventDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useEventDialog must be used inside <DialogProvider>')
  return ctx
}
