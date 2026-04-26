const THEME = {
  blue:   { borderTop: '4px solid #3b82f6', iconBg: '#eff6ff', iconColor: '#3b82f6' },
  green:  { borderTop: '4px solid #10b981', iconBg: '#f0fdf4', iconColor: '#10b981' },
  purple: { borderTop: '4px solid #8b5cf6', iconBg: '#f5f3ff', iconColor: '#8b5cf6' },
  amber:  { borderTop: '4px solid #f59e0b', iconBg: '#fffbeb', iconColor: '#f59e0b' },
  slate:  { borderTop: '4px solid #94a3b8', iconBg: '#f1f5f9', iconColor: '#94a3b8' },
}

export default function StatCard({ label, value, sub, color = 'slate', icon }) {
  const theme = THEME[color] ?? THEME.slate
  return (
    <div style={{
      background: '#ffffff', borderRadius: 12,
      border: '1px solid #e2e8f0', borderTop: theme.borderTop,
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
          {label}
        </p>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: theme.iconBg, color: theme.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
        {value ?? '—'}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
