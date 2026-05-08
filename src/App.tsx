import Designer from './pages/Designer'

export default function App() {
  return (
    <div className="min-h-dvh bg-[#070B14] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      <Designer />

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-xs text-white/40">
        Scout Factory Designer • Glassmorphism UI • Hardcoded manufacturing rules • Offline-friendly Pantone-lite palette
      </footer>
    </div>
  )
}
