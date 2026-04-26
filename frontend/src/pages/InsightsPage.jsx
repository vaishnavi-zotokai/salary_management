import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInsights, getDepartmentInsights } from '../api/employees'
import StatCard from '../components/StatCard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'India',
  'Canada', 'Australia', 'France', 'Brazil', 'Singapore', 'Japan',
]
const JOB_TITLES = [
  '', 'Software Engineer', 'Senior Software Engineer', 'Product Manager',
  'Data Analyst', 'DevOps Engineer', 'UX Designer', 'HR Manager',
  'Marketing Manager', 'Finance Analyst', 'Sales Executive',
  'Engineering Manager', 'Data Scientist', 'QA Engineer', 'Scrum Master',
]
const ALL_DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Data',
  'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Legal',
]
const BONUS_RATES = {
  'Software Engineer': 0.12, 'Senior Software Engineer': 0.15,
  'Product Manager': 0.18,   'Data Analyst': 0.10,
  'DevOps Engineer': 0.14,   'UX Designer': 0.10,
  'HR Manager': 0.09,        'Marketing Manager': 0.11,
  'Finance Analyst': 0.10,   'Sales Executive': 0.20,
  'Engineering Manager': 0.22,'Data Scientist': 0.16,
  'QA Engineer': 0.09,       'Scrum Master': 0.11,
}

// One distinct color per department — used consistently across pills, bars, table
const DEPT_COLOR = {
  Engineering:  '#4f46e5',
  Product:      '#7c3aed',
  Design:       '#db2777',
  Data:         '#0891b2',
  HR:           '#059669',
  Finance:      '#d97706',
  Marketing:    '#ea580c',
  Sales:        '#16a34a',
  Operations:   '#64748b',
  Legal:        '#dc2626',
}
const DEPT_BG = {
  Engineering:  '#eef2ff',
  Product:      '#f5f3ff',
  Design:       '#fdf2f8',
  Data:         '#ecfeff',
  HR:           '#f0fdf4',
  Finance:      '#fffbeb',
  Marketing:    '#fff7ed',
  Sales:        '#f0fdf4',
  Operations:   '#f8fafc',
  Legal:        '#fef2f2',
}

// ── Formatters ────────────────────────────────────────────────────────────────

const getBonusRate = (title) => BONUS_RATES[title] ?? 0.12
const fmt         = (n) => n != null ? `$${Math.round(n).toLocaleString()}` : '—'
const fmtCompact  = (n) => {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n).toLocaleString()}`
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const selectStyle = {
  border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px',
  background: '#fff', fontSize: 14, color: '#0f172a',
  cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const AvgIcon     = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12 6 7l3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const PayrollIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.5"/></svg>
const GapIcon     = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M10 5l3 3-3 3M6 5 3 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const BonusIcon   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
const UsersIcon   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 13c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M11.5 3a2 2 0 0 1 0 4M15 13c0-1.657-1.567-3-3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>

// ── Shared sub-components ─────────────────────────────────────────────────────

const AXIS_STYLE = { fontSize: 12, fill: '#94a3b8' }

const makeTooltip = (valueLabel) => ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
        {typeof payload[0].value === 'number' ? `$${payload[0].value.toLocaleString()}` : payload[0].value}
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{valueLabel}</p>
    </div>
  )
}

const SalaryTooltip = makeTooltip('avg salary')
const BonusTooltip  = makeTooltip('est. bonus')
const DeptTooltip   = makeTooltip('avg salary')

function ChartCard({ title, subtitle, legend, children }) {
  return (
    <div style={{ flex: 1, minHeight: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{title}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{subtitle}</p>
        </div>
        {legend}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  )
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', flexShrink: 0, flexWrap: 'wrap' }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  )
}

const SKELETON_CARD = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', borderTop: '4px solid #e2e8f0', height: 110, animation: 'pulse 1.5s ease-in-out infinite' }

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ country, jobTitle }) {
  const { data, isLoading } = useQuery({
    queryKey: ['insights', country, jobTitle],
    queryFn: () => getInsights({ country, job_title: jobTitle || undefined }),
    enabled: !!country,
  })

  const { data: allData } = useQuery({
    queryKey: ['insights-all', jobTitle],
    queryFn: () => Promise.all(
      COUNTRIES.map(c =>
        getInsights({ country: c, job_title: jobTitle || undefined })
          .then(d => ({ country: c.split(' ')[0], full: c, avg: Math.round(d.avg_salary ?? 0) }))
          .catch(() => ({ country: c.split(' ')[0], full: c, avg: 0 }))
      )
    ),
  })

  const bonusRate    = getBonusRate(jobTitle)
  const totalPayroll = data?.avg_salary && data?.employee_count ? data.avg_salary * data.employee_count : null
  const bonusPool    = totalPayroll ? totalPayroll * bonusRate : null
  const payGapRatio  = data?.min_salary && data?.max_salary ? (data.max_salary / data.min_salary).toFixed(1) : null

  const validCountries = (allData ?? []).filter(d => d.avg > 0)
  const globalAvg      = validCountries.length ? Math.round(validCountries.reduce((s, d) => s + d.avg, 0) / validCountries.length) : null
  const sortedByAvg    = [...validCountries].sort((a, b) => b.avg - a.avg)
  const countryRank    = sortedByAvg.findIndex(d => d.full === country) + 1

  const salaryChartData = allData ?? []
  const bonusChartData  = (allData ?? []).map(item => ({ ...item, bonus: Math.round(item.avg * bonusRate) }))

  const barShape = (dataKey, selectedFill, otherFill) => (props) => {
    const { x, y, width, height, payload } = props
    return <rect x={x} y={y} width={width} height={Math.max(0, height)} fill={payload.full === country ? selectedFill : otherFill} rx={4} ry={4} />
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flexShrink: 0 }}>
        {isLoading ? [...Array(5)].map((_, i) => <div key={i} style={SKELETON_CARD} />) : (<>
          <StatCard label="Avg Salary"    value={fmt(data?.avg_salary)}  color="purple" sub={country}                                      icon={<AvgIcon />} />
          <StatCard label="Total Payroll" value={fmtCompact(totalPayroll)} color="blue" sub={`${(data?.employee_count ?? 0).toLocaleString()} employees`} icon={<PayrollIcon />} />
          <StatCard label="Pay Gap"       value={payGapRatio ? `${payGapRatio}×` : '—'} color="amber" sub="max ÷ min salary"              icon={<GapIcon />} />
          <StatCard label="Bonus Pool"    value={fmtCompact(bonusPool)}  color="green"  sub={`${Math.round(bonusRate * 100)}% · ${jobTitle || 'all roles'}`} icon={<BonusIcon />} />
          <StatCard label="Employees"     value={(data?.employee_count ?? 0).toLocaleString()} color="slate" sub={country}                icon={<UsersIcon />} />
        </>)}
      </div>

      {/* Country rank bar */}
      {countryRank > 0 && !isLoading && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: 18 }}>{countryRank === 1 ? '🥇' : countryRank === 2 ? '🥈' : countryRank === 3 ? '🥉' : '📊'}</span>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>{country}</strong> ranks{' '}
            <strong style={{ color: '#4f46e5' }}>#{countryRank} of {sortedByAvg.length}</strong> countries by average salary
            {jobTitle && <span style={{ color: '#94a3b8' }}> for {jobTitle}s</span>}.
            {globalAvg && <span style={{ color: '#94a3b8' }}> Global average: {fmt(globalAvg)}.</span>}
          </p>
        </div>
      )}

      {/* Two charts */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
        <ChartCard
          title="Average Salary by Country"
          subtitle={`${jobTitle || 'All roles'} · dashed = global average`}
          legend={<Legend items={[{ color: '#4f46e5', label: 'Selected' }, { color: '#c7d2fe', label: 'Others' }, { color: '#94a3b8', label: 'Global avg' }]} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryChartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="country" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              {globalAvg && <ReferenceLine y={globalAvg} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} />}
              <Tooltip content={<SalaryTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="avg" maxBarSize={48} shape={barShape('avg', '#4f46e5', '#c7d2fe')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Estimated Bonus by Country"
          subtitle={`${Math.round(getBonusRate(jobTitle) * 100)}% of avg salary · ${jobTitle || 'all roles'}`}
          legend={<Legend items={[{ color: '#059669', label: 'Selected' }, { color: '#a7f3d0', label: 'Others' }]} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bonusChartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="country" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <Tooltip content={<BonusTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="bonus" maxBarSize={48} shape={barShape('bonus', '#059669', '#a7f3d0')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

// ── Department Compare Tab ────────────────────────────────────────────────────

function DepartmentTab({ country }) {
  const [selected, setSelected] = useState(new Set(['Engineering', 'Product', 'Design', 'Data', 'HR']))

  const { data: deptData, isLoading } = useQuery({
    queryKey: ['dept-insights', country],
    queryFn: () => getDepartmentInsights(country),
    enabled: !!country,
  })

  const toggle = (dept) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(dept)) { if (next.size > 1) next.delete(dept) }
      else next.add(dept)
      return next
    })

  const rows = (deptData ?? []).filter(d => selected.has(d.department))

  // Chart data: avg salary per selected dept, sorted descending
  const chartData = rows.map(d => ({
    department: d.department,
    avg:        Math.round(d.avg_salary ?? 0),
    min:        Math.round(d.min_salary ?? 0),
    max:        Math.round(d.max_salary ?? 0),
    fill:       DEPT_COLOR[d.department] ?? '#64748b',
  }))

  const overallAvg = rows.length
    ? Math.round(rows.reduce((s, d) => s + (d.avg_salary ?? 0), 0) / rows.length)
    : null

  const CustomDeptTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const row = rows.find(d => d.department === label)
    if (!row) return null
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: DEPT_COLOR[label] ?? '#64748b', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[['Avg Salary', fmt(row.avg_salary)], ['Min Salary', fmt(row.min_salary)], ['Max Salary', fmt(row.max_salary)], ['Employees', row.employee_count.toLocaleString()]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#94a3b8' }}>{k}</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Department pill selectors */}
      <div style={{ flexShrink: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
          Select departments to compare
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_DEPARTMENTS.map(dept => {
            const active = selected.has(dept)
            const color  = DEPT_COLOR[dept] ?? '#64748b'
            const bg     = DEPT_BG[dept]   ?? '#f8fafc'
            const count  = (deptData ?? []).find(d => d.department === dept)?.employee_count
            return (
              <button
                key={dept}
                onClick={() => toggle(dept)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 14px', borderRadius: 20,
                  border: `1.5px solid ${active ? color : '#e2e8f0'}`,
                  background: active ? bg : '#ffffff',
                  color: active ? color : '#94a3b8',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? color : '#cbd5e1', display: 'inline-block', flexShrink: 0 }} />
                {dept}
                {count != null && (
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>({count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content: chart + table side by side */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>

        {/* Bar chart — avg salary per department */}
        <ChartCard
          title="Avg Salary by Department"
          subtitle={`${country} · ${selected.size} department${selected.size !== 1 ? 's' : ''} selected`}
          legend={overallAvg ? (
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 24, borderTop: '2px dashed #94a3b8', display: 'inline-block' }} />
              Avg of selection: {fmt(overallAvg)}
            </span>
          ) : null}
        >
          {isLoading ? (
            <div style={{ height: '100%', background: '#f8fafc', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                {overallAvg && <ReferenceLine x={overallAvg} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} />}
                <Tooltip content={<CustomDeptTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="avg"
                  maxBarSize={36}
                  radius={[0, 4, 4, 0]}
                  shape={(props) => {
                    const { x, y, width, height, payload } = props
                    return <rect x={x} y={y} width={Math.max(0, width)} height={height} fill={payload.fill} rx={4} ry={4} />
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Comparison table */}
        <div style={{ width: 420, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>Department Breakdown</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{country} · sorted by avg salary</p>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px', gap: 0, padding: '8px 18px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            {['Department', 'Avg', 'Range', 'Count'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {/* Scrollable rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, height: 14, background: '#e2e8f0', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: 60, height: 14, background: '#e2e8f0', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            ) : rows.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No departments selected
              </div>
            ) : (
              rows.map((d, i) => {
                const color   = DEPT_COLOR[d.department] ?? '#64748b'
                const bg      = DEPT_BG[d.department]   ?? '#f8fafc'
                const payGap  = d.min_salary ? (d.max_salary / d.min_salary).toFixed(1) : '—'
                const isTop   = i === 0
                return (
                  <div
                    key={d.department}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px',
                      padding: '11px 18px', borderBottom: '1px solid #f8fafc',
                      background: isTop ? bg : 'transparent',
                      transition: 'background 0.1s',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = bg}
                    onMouseLeave={e => e.currentTarget.style.background = isTop ? bg : 'transparent'}
                  >
                    {/* Dept name + color dot */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.department}</span>
                      {isTop && <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${color}`, borderRadius: 4, padding: '1px 5px' }}>TOP</span>}
                    </div>
                    {/* Avg salary */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(d.avg_salary)}
                    </span>
                    {/* Pay gap ratio */}
                    <span style={{ fontSize: 12, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                      {payGap !== '—' ? `${payGap}×` : '—'}
                    </span>
                    {/* Employee count */}
                    <span style={{ fontSize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                      {d.employee_count.toLocaleString()}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [country,   setCountry]   = useState('United States')
  const [jobTitle,  setJobTitle]  = useState('')

  const tabBtn = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '7px 18px', borderRadius: 8, border: 'none',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        background: activeTab === id ? '#0f172a' : 'transparent',
        color:      activeTab === id ? '#ffffff'  : '#64748b',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { if (activeTab !== id) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' } }}
      onMouseLeave={e => { if (activeTab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' } }}
    >
      {label}
    </button>
  )

  return (
    <div style={{
      height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column',
      padding: '20px 32px', overflow: 'hidden',
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box', gap: 16,
    }}>

      {/* Top bar: title + tabs + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Salary Insights</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Benchmarks by country, role and department</p>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
            {tabBtn('overview',    '📊 Overview')}
            {tabBtn('departments', '🏢 Department Compare')}
          </div>
        </div>

        {/* Filters — right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={country}  onChange={e => setCountry(e.target.value)}  style={{ ...selectStyle, minWidth: 155 }}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {activeTab === 'overview' && (
            <select value={jobTitle} onChange={e => setJobTitle(e.target.value)} style={{ ...selectStyle, minWidth: 195 }}>
              {JOB_TITLES.map(t => <option key={t} value={t}>{t || 'All job titles'}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview'
        ? <OverviewTab    country={country} jobTitle={jobTitle} />
        : <DepartmentTab  country={country} />
      }
    </div>
  )
}
