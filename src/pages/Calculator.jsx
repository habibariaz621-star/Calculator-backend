import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create, all } from 'mathjs'
import { useAuth } from '../context/AuthContext'

const math = create(all, {})
const MAX_LENGTH = 48
const MAX_HISTORY = 15
const HISTORY_KEY = 'scientific-calculator-history'

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const BUTTONS = [
  { label: 'sin', value: 'sin(', variant: 'sci' },
  { label: 'cos', value: 'cos(', variant: 'sci' },
  { label: 'tan', value: 'tan(', variant: 'sci' },
  { label: '√', value: 'sqrt(', variant: 'sci' },
  { label: 'log', value: 'log(', variant: 'sci' },
  { label: 'C', action: 'clear', variant: 'danger' },
  { label: '⌫', action: 'backspace', variant: 'muted' },
  { label: '÷', value: '/', variant: 'op' },
  { label: '7', value: '7', variant: 'num' },
  { label: '8', value: '8', variant: 'num' },
  { label: '9', value: '9', variant: 'num' },
  { label: '×', value: '*', variant: 'op' },
  { label: '4', value: '4', variant: 'num' },
  { label: '5', value: '5', variant: 'num' },
  { label: '6', value: '6', variant: 'num' },
  { label: '−', value: '-', variant: 'op' },
  { label: '1', value: '1', variant: 'num' },
  { label: '2', value: '2', variant: 'num' },
  { label: '3', value: '3', variant: 'num' },
  { label: '+', value: '+', variant: 'op' },
  { label: '0', value: '0', variant: 'num', wide: true },
  { label: '.', value: '.', variant: 'num' },
  { label: '=', action: 'equals', variant: 'equal' },
]

const VARIANT_STYLES = {
  sci: 'bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 dark:bg-cyan-400/10 dark:text-cyan-300 dark:hover:bg-cyan-400/20',
  num: 'bg-white/50 text-slate-800 hover:bg-white/80 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20',
  op: 'bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 dark:bg-violet-400/10 dark:text-violet-300 dark:hover:bg-violet-400/20',
  danger: 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20',
  muted: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:hover:bg-slate-400/20',
  equal:
    'bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/30',
}

function formatResult(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'Error'
    if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) {
      return value.toExponential(6).replace(/\.?0+e/, 'e')
    }
    return String(math.round(value, 10))
  }
  return String(value)
}

function endsWithOperator(expression) {
  return /[+\-*/^]$/.test(expression.trim())
}

function isPlainNumber(value) {
  return /^-?\d+\.?\d*$/.test(value) || /^-?\d*\.\d+$/.test(value)
}

function canAppendValue(expression, value) {
  if (expression === 'Error' && !/^[0-9]$/.test(value) && value !== '-' && !value.endsWith('(')) {
    return false
  }
  if (expression.length >= MAX_LENGTH) return false
  if (/^[0-9]$/.test(value)) return true

  if (value === '.') {
    if (endsWithOperator(expression)) return false
    const lastSegment = expression.split(/[+\-*/^()]/).pop() ?? expression
    return !lastSegment.includes('.')
  }

  if (/^[+\-*/]$/.test(value)) {
    if (!expression || expression === 'Error') return value === '-'
    if (endsWithOperator(expression)) return false
    return true
  }

  if (value.endsWith('(')) {
    if (!expression || expression === '0' || expression === 'Error' || endsWithOperator(expression)) {
      return true
    }
    return false
  }

  return true
}

function appendValue(expression, value) {
  if (!canAppendValue(expression, value)) return expression

  if (expression === 'Error') {
    if (/^[0-9]$/.test(value)) return value
    if (value === '-' || value.endsWith('(')) return value
    return expression
  }

  if (isPlainNumber(expression) && /^[0-9]$/.test(value)) return value
  if (isPlainNumber(expression) && value.endsWith('(')) return value
  if (expression === '0' && /^[0-9]$/.test(value)) return value
  if (expression === '0' && value === '.') return '0.'
  if (expression === '0' && (value.endsWith('(') || value === '-')) return value

  return expression + value
}

function evaluateExpression(expression, useDegrees) {
  if (!expression || expression === 'Error') return null

  const scope = useDegrees
    ? {
        sin: (x) => math.sin(math.unit(x, 'deg')),
        cos: (x) => math.cos(math.unit(x, 'deg')),
        tan: (x) => math.tan(math.unit(x, 'deg')),
        log: (x) => math.log10(x),
        sqrt: math.sqrt,
      }
    : {
        sin: math.sin,
        cos: math.cos,
        tan: math.tan,
        log: math.log10,
        sqrt: math.sqrt,
      }

  try {
    const result = math.evaluate(expression, scope)
    if (typeof result === 'object' && result?.re !== undefined) {
      return formatResult(result.re)
    }
    return formatResult(result)
  } catch {
    return 'Error'
  }
}

export default function Calculator() {
  const { user, logout, verifyCalculatorAccess } = useAuth()
  const navigate = useNavigate()
  const [expression, setExpression] = useState('0')
  const [preview, setPreview] = useState('')
  const [useDegrees, setUseDegrees] = useState(true)
  const [history, setHistory] = useState(loadHistory)
  const [accessVerified, setAccessVerified] = useState(false)

  useEffect(() => {
    verifyCalculatorAccess()
      .then(() => setAccessVerified(true))
      .catch(() => {
        logout()
        navigate('/login')
      })
  }, [verifyCalculatorAccess, logout, navigate])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const livePreview = useMemo(() => {
    if (!expression || expression === 'Error' || endsWithOperator(expression)) return ''
    const result = evaluateExpression(expression, useDegrees)
    return result && result !== 'Error' ? result : ''
  }, [expression, useDegrees])

  const append = useCallback((value) => {
    setPreview('')
    setExpression((current) => appendValue(current === 'Error' ? '0' : current, value))
  }, [])

  const handleClear = useCallback(() => {
    setExpression('0')
    setPreview('')
  }, [])

  const handleBackspace = useCallback(() => {
    setExpression((current) => {
      if (current === 'Error') return '0'
      if (current.length <= 1) return '0'
      return current.slice(0, -1)
    })
  }, [])

  const handleEquals = useCallback(() => {
    setExpression((current) => {
      if (!current || current === 'Error' || endsWithOperator(current)) return current
      const result = evaluateExpression(current, useDegrees)
      if (result === null) return current

      if (result !== 'Error') {
        setHistory((entries) =>
          [
            {
              id: `${Date.now()}-${entries.length}`,
              expression: current,
              result,
            },
            ...entries,
          ].slice(0, MAX_HISTORY),
        )
      }

      setPreview(current)
      return result
    })
  }, [useDegrees])

  const handleHistorySelect = useCallback((entry) => {
    setPreview('')
    setExpression(entry.expression)
  }, [])

  const handleClearHistory = useCallback(() => setHistory([]), [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleButton = useCallback(
    (button) => {
      if (button.action === 'clear') handleClear()
      else if (button.action === 'backspace') handleBackspace()
      else if (button.action === 'equals') handleEquals()
      else if (button.value) append(button.value)
    },
    [append, handleBackspace, handleClear, handleEquals],
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      const { key } = event

      if (key >= '0' && key <= '9') {
        event.preventDefault()
        append(key)
        return
      }

      if (key === '.' || key === ',') {
        event.preventDefault()
        append('.')
        return
      }

      if (key === '+' || key === '-' || key === '*' || key === '/') {
        event.preventDefault()
        append(key)
        return
      }

      if (key === 'Enter' || key === '=') {
        event.preventDefault()
        handleEquals()
        return
      }

      if (key === 'Escape') {
        event.preventDefault()
        handleClear()
        return
      }

      if (key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [append, handleBackspace, handleClear, handleEquals])

  const buttonClass =
    'flex items-center justify-center rounded-2xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 sm:text-lg h-14 sm:h-16'

  if (!accessVerified) {
    return (
      <div className="flex min-h-[100svh] w-full items-center justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Verifying access...</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[100svh] w-full flex-1 items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-violet-200/30 to-cyan-400/20 dark:from-indigo-950 dark:via-slate-900 dark:to-cyan-950" />
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />

      <div className="relative w-full max-w-lg">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-3xl">
              Advanced Calculator
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Welcome, {user?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/30 bg-white/30 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
          >
            Logout
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/30 bg-white/20 p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-black/40 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Angle mode
            </span>
            <button
              type="button"
              onClick={() => setUseDegrees((value) => !value)}
              className="rounded-full border border-white/30 bg-white/30 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
            >
              {useDegrees ? 'DEG' : 'RAD'}
            </button>
          </div>

          <div className="mb-5 overflow-hidden rounded-2xl border border-white/20 bg-slate-900/80 px-4 py-4 shadow-inner backdrop-blur-md dark:bg-black/50 sm:px-5 sm:py-5">
            {preview && (
              <p className="truncate text-right text-xs text-slate-400 sm:text-sm">{preview} =</p>
            )}
            {livePreview && livePreview !== expression && !preview && (
              <p className="truncate text-right text-xs text-cyan-300/80 sm:text-sm">= {livePreview}</p>
            )}
            <p className="truncate text-right font-mono text-3xl font-semibold text-white sm:text-4xl">
              {expression}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {BUTTONS.map((button) => (
              <button
                key={button.label + (button.wide ? '-wide' : '')}
                type="button"
                onClick={() => handleButton(button)}
                className={`${buttonClass} ${VARIANT_STYLES[button.variant]} ${
                  button.wide ? 'col-span-2' : ''
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Keyboard: 0–9, operators, Enter, Backspace, Esc
          </p>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/30 bg-white/20 p-4 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              History
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs font-medium text-violet-600 transition hover:text-violet-700 dark:text-violet-400"
              >
                Clear history
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Completed calculations are saved here automatically.
            </p>
          ) : (
            <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => handleHistorySelect(entry)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/30 px-3 py-2.5 text-left transition hover:bg-white/50 active:scale-[0.99] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <span className="mr-3 truncate text-sm text-slate-600 dark:text-slate-400">
                      {entry.expression} =
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {entry.result}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
