const colors = {
    blue:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    green:  'bg-green-50 text-green-700 ring-1 ring-green-200',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    amber:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    slate:  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  }
  
  export default function Badge({ children, color = 'slate' }) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
        {children}
      </span>
    )
  }