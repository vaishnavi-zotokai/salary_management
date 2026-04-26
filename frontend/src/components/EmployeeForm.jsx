import { useState } from 'react'

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'India',
  'Canada', 'Australia', 'France', 'Brazil', 'Singapore', 'Japan',
]
const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Product Manager',
  'Data Analyst', 'DevOps Engineer', 'UX Designer', 'HR Manager',
  'Marketing Manager', 'Finance Analyst', 'Sales Executive',
  'Engineering Manager', 'Data Scientist', 'QA Engineer', 'Scrum Master',
]
const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Data', 'HR',
  'Finance', 'Marketing', 'Sales', 'Operations', 'Legal',
]

const fieldStyle = (hasError) => ({
  width: '100%', border: `1px solid ${hasError ? '#f87171' : '#e2e8f0'}`,
  borderRadius: 8, padding: '8px 12px', fontSize: 14,
  background: '#ffffff', color: '#0f172a',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
  boxShadow: hasError ? '0 0 0 2px rgba(248,113,113,0.2)' : 'none',
})

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#475569', marginBottom: 6,
}

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
    if (!form.full_name.trim())                   e.full_name = 'Required'
    if (!form.job_title)                          e.job_title = 'Required'
    if (!form.country)                            e.country   = 'Required'
    if (!form.salary || Number(form.salary) <= 0) e.salary    = 'Must be a positive number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, salary: Number(form.salary) })
  }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
  const errStyle = { color: '#ef4444', fontSize: 12, marginTop: 4 }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Full name — spans both columns */}
      <div>
        <label style={labelStyle}>Full name *</label>
        <input style={fieldStyle(errors.full_name)} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Doe" />
        {errors.full_name && <p style={errStyle}>{errors.full_name}</p>}
      </div>

      <div style={grid2}>
        <div>
          <label style={labelStyle}>Job title *</label>
          <select style={fieldStyle(errors.job_title)} value={form.job_title} onChange={e => set('job_title', e.target.value)}>
            <option value="">Select…</option>
            {JOB_TITLES.map(t => <option key={t}>{t}</option>)}
          </select>
          {errors.job_title && <p style={errStyle}>{errors.job_title}</p>}
        </div>
        <div>
          <label style={labelStyle}>Country *</label>
          <select style={fieldStyle(errors.country)} value={form.country} onChange={e => set('country', e.target.value)}>
            <option value="">Select…</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.country && <p style={errStyle}>{errors.country}</p>}
        </div>
      </div>

      <div style={grid2}>
        <div>
          <label style={labelStyle}>Salary (USD) *</label>
          <input style={fieldStyle(errors.salary)} type="number" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="85000" min="0" />
          {errors.salary && <p style={errStyle}>{errors.salary}</p>}
        </div>
        <div>
          <label style={labelStyle}>Department</label>
          <select style={fieldStyle(false)} value={form.department} onChange={e => set('department', e.target.value)}>
            <option value="">Select…</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input style={fieldStyle(false)} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1, background: loading ? '#94a3b8' : '#0f172a', color: '#ffffff',
            border: 'none', borderRadius: 8, padding: '10px 0',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, background: '#ffffff', color: '#475569',
            border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
