import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInsights } from '../api/employees'
import StatCard from '../components/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const COUNTRIES = [
  'United States','United Kingdom','Germany','India',
  'Canada','Australia','France','Brazil','Singapore','Japan'
]
const JOB_TITLES = [
  '','Software Engineer','Senior Software Engineer','Product Manager',
  'Data Analyst','DevOps Engineer','UX Designer','HR Manager',
  'Marketing Manager','Finance Analyst','Sales Executive',
  'Engineering Manager','Data Scientist','QA Engineer','Scrum Master'
]

const fmt = (n) => n != null ? `$${Math.round(n).toLocaleString()}` : '—'

export default function InsightsPage() {
  const [country, setCountry]     = useState('United States')
  const [jobTitle, setJobTitle]   = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['insights', country, jobTitle],
    queryFn: () => getInsights({ country, job_title: jobTitle || undefined }),
    enabled: !!country,
  })

  // Build comparison chart data across all countries
  const { data: allData } = useQuery({
    queryKey: ['insights-all', jobTitle],
    queryFn: () => Promise.all(
      COUNTRIES.map(c => getInsights({ country: c, job_title: jobTitle || undefined })
        .then(d => ({ country: c.split(' ')[0], avg: Math.round(d.avg_salary ?? 0) }))
        .catch(() => ({ country: c.split(' ')[0], avg: 0 }))
      )
    ),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Salary Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aggregate salary data by country and role</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        >
          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white w-56"
        >
          {JOB_TITLES.map(t => <option key={t} value={t}>{t || 'All job titles'}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Min Salary"       value={fmt(data?.min_salary)}     color="blue"   sub={country} />
          <StatCard label="Max Salary"       value={fmt(data?.max_salary)}     color="green"  sub={country} />
          <StatCard label="Avg Salary"       value={fmt(data?.avg_salary)}     color="purple" sub={country} />
          <StatCard label="Total Employees"  value={data?.employee_count ?? 0} color="amber"  sub={country} />
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-medium text-slate-700 mb-1">
          Average salary by country
          {jobTitle && <span className="text-slate-400"> — {jobTitle}</span>}
        </h2>
        <p className="text-xs text-slate-400 mb-6">Comparison across all regions</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={allData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="country" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [`$${v.toLocaleString()}`, 'Avg Salary']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Bar dataKey="avg" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}