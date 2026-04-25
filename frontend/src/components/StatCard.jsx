export default function StatCard({ label, value, sub, color = 'slate' }) {
    const accents = {
      blue:   'border-t-blue-500',
      green:  'border-t-green-500',
      purple: 'border-t-purple-500',
      amber:  'border-t-amber-500',
      slate:  'border-t-slate-400',
    }
    return (
      <div className={`bg-white rounded-xl border border-slate-200 border-t-4 ${accents[color]} p-5 shadow-sm`}>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value ?? '—'}</p>
        {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
      </div>
    )
  }