export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-violet-500/20 to-cyan-500/30 dark:from-indigo-950 dark:via-slate-900 dark:to-cyan-950" />
      <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl animate-pulse" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/40">
            ∑
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/30 bg-white/20 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-black/40 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
