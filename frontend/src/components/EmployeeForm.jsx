import { useState } from 'react'

const COUNTRIES = [
  'United States','United Kingdom','Germany','India',
  'Canada','Australia','France','Brazil','Singapore','Japan'
]
const JOB_TITLES = [
  'Software Engineer','Senior Software Engineer','Product Manager',
  'Data Analyst','DevOps Engineer','UX Designer','HR Manager',
  'Marketing Manager','Finance Analyst','Sales Executive',
  'Engineering Manager','Data Scientist','QA Engineer','Scrum Master'
]
const DEPARTMENTS = [
  'Engineering','Product','Design','Data','HR',
  'Finance','Marketing','Sales','Operations','Legal'
]

const input = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
const label = "block text-xs font-medium text-slate-600 mb-1"

export default function EmployeeForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    full_name:  initial.full_name  ?? '',
    job_title:  initial.job_title  ?? '',
    country:    initial.country    ?? '',
    salary:     initial.salary     ?? '',
    department: initial.department ?? '',
    email:      initial.email      ?? '',
    currency:   initial.currency   ?? 'USD',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Required'
    if (!form.job_title)        e.job_title = 'Required'
    if (!form.country)          e.country   = 'Required'
    if (!form.salary || Number(form.salary) <= 0) e.salary = 'Must be a positive number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, salary: Number(form.salary) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={label}>Full name *</label>
          <input className={input} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Doe" />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
        </div>
        <div>
          <label className={label}>Job title *</label>
          <select className={input} value={form.job_title} onChange={e => set('job_title', e.target.value)}>
            <option value="">Select...</option>
            {JOB_TITLES.map(t => <option key={t}>{t}</option>)}
          </select>
          {errors.job_title && <p className="text-red-500 text-xs mt-1">{errors.job_title}</p>}
        </div>
        <div>
          <label className={label}>Country *</label>
          <select className={input} value={form.country} onChange={e => set('country', e.target.value)}>
            <option value="">Select...</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
        </div>
        <div>
          <label className={label}>Salary *</label>
          <input className={input} type="number" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="85000" />
          {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
        </div>
        <div>
          <label className={label}>Department</label>
          <select className={input} value={form.department} onChange={e => set('department', e.target.value)}>
            <option value="">Select...</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={label}>Email</label>
          <input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}