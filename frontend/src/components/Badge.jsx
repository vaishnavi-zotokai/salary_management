const COLORS = {
  blue:   { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  green:  { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
  purple: { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' },
  amber:  { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
  slate:  { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
}

export default function Badge({ children, color = 'slate' }) {
  const theme = COLORS[color] ?? COLORS.slate
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      fontSize: 12, fontWeight: 500,
      ...theme,
    }}>
      {children}
    </span>
  )
}
