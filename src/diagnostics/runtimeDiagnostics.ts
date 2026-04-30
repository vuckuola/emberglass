const STORAGE_KEY = 'emberglass_runtime_diagnostics'
const MAX_EVENTS = 20

export type RuntimeDiagnosticEntry = {
  timestamp: number
  kind: 'error' | 'unhandledrejection'
  message: string
  stack?: string
  source?: string
  line?: number
  column?: number
}

type RuntimeDiagnosticsApi = {
  list: () => RuntimeDiagnosticEntry[]
  clear: () => void
  exportJson: () => string
}

declare global {
  interface Window {
    __EMBERGLASS_DIAGNOSTICS__?: RuntimeDiagnosticsApi
    __EMBERGLASS_RUNTIME_DIAGNOSTICS_INSTALLED__?: boolean
  }
}

function readEntries(): RuntimeDiagnosticEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

function isEntry(value: unknown): value is RuntimeDiagnosticEntry {
  return typeof value === 'object' && value !== null && typeof (value as RuntimeDiagnosticEntry).message === 'string'
}

function writeEntries(entries: RuntimeDiagnosticEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_EVENTS)))
  } catch {
    // Ignore localStorage quota/availability issues in static demo mode.
  }
}

function record(entry: RuntimeDiagnosticEntry) {
  const entries = readEntries()
  entries.push(entry)
  writeEntries(entries)
}

function makeApi(): RuntimeDiagnosticsApi {
  return {
    list: () => readEntries(),
    clear: () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // noop
      }
    },
    exportJson: () => JSON.stringify(readEntries(), null, 2),
  }
}

export function installRuntimeDiagnostics() {
  if (typeof window === 'undefined' || window.__EMBERGLASS_RUNTIME_DIAGNOSTICS_INSTALLED__) {
    return
  }

  window.__EMBERGLASS_RUNTIME_DIAGNOSTICS_INSTALLED__ = true
  window.__EMBERGLASS_DIAGNOSTICS__ = makeApi()

  window.addEventListener('error', (event) => {
    record({
      timestamp: Date.now(),
      kind: 'error',
      message: event.message || 'Unknown runtime error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: event.filename || undefined,
      line: typeof event.lineno === 'number' ? event.lineno : undefined,
      column: typeof event.colno === 'number' ? event.colno : undefined,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    record({
      timestamp: Date.now(),
      kind: 'unhandledrejection',
      message: reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection'),
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}
