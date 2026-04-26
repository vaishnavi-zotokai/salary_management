import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees'
import Modal from '../components/Modal'
import EmployeeForm from '../components/EmployeeForm'
import Badge from '../components/Badge'

// ── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  '', 'United States', 'United Kingdom', 'Germany', 'India',
  'Canada', 'Australia', 'France', 'Brazil', 'Singapore', 'Japan',
]
const DEPARTMENTS = [
  '', 'Engineering', 'Product', 'Design', 'Data', 'HR',
  'Finance', 'Marketing', 'Sales', 'Operations', 'Legal',
]
const deptColor = {
  Engineering: 'blue',  Product: 'purple', Design: 'purple',
  Data: 'blue',         HR: 'green',       Finance: 'amber',
  Marketing: 'amber',   Sales: 'green',    Operations: 'slate', Legal: 'slate',
}

const AVATAR_PALETTE = [
  { bg: '#ede9fe', color: '#6d28d9' }, { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#d1fae5', color: '#065f46' }, { bg: '#fef3c7', color: '#92400e' },
  { bg: '#fee2e2', color: '#991b1b' }, { bg: '#e0e7ff', color: '#3730a3' },
  { bg: '#ccfbf1', color: '#134e4a' }, { bg: '#ffedd5', color: '#9a3412' },
]
const avatarTheme = (name) => {
  const sum = [...(name || 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length]
}

const PAGE_SIZE = 15

// ── Column widths (shared between header table and body table) ───────────────
// Must be identical in both <colgroup>s so columns align.
const COL_WIDTHS = ['24%', '21%', '13%', '13%', '14%', '15%']
const COL_LABELS = ['Name', 'Job Title', 'Country', 'Department', 'Salary', '']

function Colgroup() {
  return (
    <colgroup>
      {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  )
}

// ── Shared cell padding ──────────────────────────────────────────────────────
const CELL_PAD = '13px 20px'
const HEAD_PAD = '10px 20px'

// ── Skeleton ─────────────────────────────────────────────────────────────────
const pulse = {
  background: '#e2e8f0', borderRadius: 4,
  animation: 'pulse 1.5s ease-in-out infinite',
}

function SkeletonRow() {
  return (
    <tr>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, ...pulse }} />
          <div style={{ width: 130, height: 13, ...pulse }} />
        </div>
      </td>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}><div style={{ width: 110, height: 13, ...pulse }} /></td>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}><div style={{ width: 70,  height: 13, ...pulse }} /></td>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}><div style={{ width: 76,  height: 20, borderRadius: 6, ...pulse }} /></td>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}><div style={{ width: 60, height: 13, ...pulse, marginLeft: 'auto' }} /></td>
      <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }} />
    </tr>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
    <path d="M6.5 11.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM13.5 13.5l-3-3"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5 11.5 4.5 4.5 11.5H2.5V9.5L9.5 2.5Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.5 8.5h7L11 3.5H3Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function IconBtn({ onClick, title, hoverBg, hoverColor, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? hoverBg : 'transparent',
        color: hov ? hoverColor : '#94a3b8',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  )
}

// ── Page component ────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const qc = useQueryClient()
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [country, setCountry]       = useState('')
  const [department, setDepartment] = useState('')
  const [modal, setModal]           = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [toast, setToast]           = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, country, department],
    queryFn: () => getEmployees({ page, page_size: PAGE_SIZE, search, country, department }),
    placeholderData: (prev) => prev,
  })

  const ok  = (msg) => setToast({ msg, ok: true })
  const err = (msg) => setToast({ msg, ok: false })

  const createMut = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); ok('Employee added.') },
    onError:   () => err('Failed to add employee.'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setModal(null); ok('Employee updated.') },
    onError:   () => err('Failed to update employee.'),
  })
  const deleteMut = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setDeleting(null); ok('Employee deleted.') },
    onError:   () => err('Failed to delete employee.'),
  })

  const total      = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const fromItem   = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const toItem     = Math.min(page * PAGE_SIZE, total)
  const hasFilters = search || country || department

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // Outer wrapper: full height of <main>, flex column, no overflow
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', padding: '24px 32px', gap: 16,
      maxWidth: 1280, margin: '0 auto', width: '100%', boxSizing: 'border-box',
    }}>

      {/* Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 10,
          background: toast.ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toast.ok ? '#bbf7d0' : '#fecaca'}`,
          color: toast.ok ? '#15803d' : '#dc2626',
          padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {toast.ok
            ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Page header — fixed height, no shrink ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
            {total > 0 ? `${total.toLocaleString()} total` : isLoading ? 'Loading…' : '0 employees'}
          </p>
        </div>
        <button
          onClick={() => setModal('add')}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0f172a', color: '#ffffff', border: 'none',
            borderRadius: 8, padding: '9px 18px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Employee
        </button>
      </div>

      {/* Filters row — fixed height, no shrink ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '8px 14px', background: '#ffffff',
        }}>
          <SearchIcon />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search employees…"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#0f172a', width: 200, fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Country */}
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(1) }}
          style={{
            border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px',
            background: '#ffffff', fontSize: 14, color: '#475569',
            cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
          }}
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c || 'All countries'}</option>)}
        </select>

        {/* Department */}
        <select
          value={department}
          onChange={e => { setDepartment(e.target.value); setPage(1) }}
          style={{
            border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 14px',
            background: '#ffffff', fontSize: 14, color: '#475569',
            cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
          }}
        >
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'All departments'}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setCountry(''); setDepartment(''); setPage(1) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#94a3b8', textDecoration: 'underline',
              fontFamily: 'inherit', padding: 0,
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table card — grows to fill remaining height, clips overflow ──────────── */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        background: '#ffffff', borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* ── Pagination (top of card) ─────────────────────────────────────── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
          background: '#ffffff',
        }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {total > 0
              ? `Showing ${fromItem.toLocaleString()}–${toItem.toLocaleString()} of ${total.toLocaleString()} employees`
              : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '5px 14px', fontSize: 13, fontWeight: 500,
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 7,
                cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit',
                color: '#475569', opacity: page === 1 ? 0.4 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, color: '#94a3b8', padding: '0 6px', fontVariantNumeric: 'tabular-nums' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '5px 14px', fontSize: 13, fontWeight: 500,
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 7,
                cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit',
                color: '#475569', opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>

        {/* ── Header table (never scrolls) ─────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', flexShrink: 0 }}>
          <Colgroup />
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {COL_LABELS.map((label, i) => (
                <th key={i} style={{
                  padding: HEAD_PAD,
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: '#94a3b8',
                  textAlign: i === 4 ? 'right' : 'left',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <Colgroup />
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 18h12M18 12v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>No employees found</span>
                      {hasFilters && <span style={{ fontSize: 13 }}>Try adjusting your filters</span>}
                    </div>
                  </td>
                </tr>
              ) : data?.items?.map(emp => {
                const av       = avatarTheme(emp.full_name)
                const initials = emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr
                    key={emp.id}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f8fafc'
                      e.currentTarget.querySelector('.row-actions').style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = ''
                      e.currentTarget.querySelector('.row-actions').style.opacity = '0'
                    }}
                  >
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: av.bg, color: av.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 14 }}>{emp.full_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#475569' }}>
                      {emp.job_title}
                    </td>
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9', fontSize: 14, color: '#475569' }}>
                      {emp.country}
                    </td>
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}>
                      {emp.department && <Badge color={deptColor[emp.department] ?? 'slate'}>{emp.department}</Badge>}
                    </td>
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                      ${emp.salary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: CELL_PAD, borderBottom: '1px solid #f1f5f9' }}>
                      <div className="row-actions" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', opacity: 0, transition: 'opacity 0.15s' }}>
                        <IconBtn onClick={() => setModal(emp)} title="Edit" hoverBg="#eef2ff" hoverColor="#4338ca">
                          <EditIcon />
                        </IconBtn>
                        <IconBtn onClick={() => setDeleting(emp)} title="Delete" hoverBg="#fef2f2" hoverColor="#dc2626">
                          <TrashIcon />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Employee">
        <EmployeeForm
          onSubmit={d => createMut.mutate(d)}
          onCancel={() => setModal(null)}
          loading={createMut.isPending}
        />
      </Modal>

      <Modal open={!!modal && modal !== 'add'} onClose={() => setModal(null)} title="Edit Employee">
        <EmployeeForm
          initial={modal !== 'add' ? modal : {}}
          onSubmit={d => updateMut.mutate({ id: modal.id, data: d })}
          onCancel={() => setModal(null)}
          loading={updateMut.isPending}
        />
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Employee">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#fef2f2', color: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrashIcon />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Delete {deleting?.full_name}?</p>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              This action cannot be undone. All data will be permanently removed.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => deleteMut.mutate(deleting?.id)}
            disabled={deleteMut.isPending}
            style={{
              flex: 1, background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', opacity: deleteMut.isPending ? 0.6 : 1,
            }}
          >
            {deleteMut.isPending ? 'Deleting…' : 'Delete employee'}
          </button>
          <button
            onClick={() => setDeleting(null)}
            style={{
              flex: 1, background: '#fff', color: '#475569',
              border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
