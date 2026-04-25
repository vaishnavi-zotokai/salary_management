import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees'
import Modal from '../components/Modal'
import EmployeeForm from '../components/EmployeeForm'
import Badge from '../components/Badge'

const COUNTRIES = [
  '','United States','United Kingdom','Germany','India',
  'Canada','Australia','France','Brazil','Singapore','Japan'
]

const deptColor = { Engineering:'blue', Product:'purple', Design:'purple',
  Data:'blue', HR:'green', Finance:'amber', Marketing:'amber',
  Sales:'green', Operations:'slate', Legal:'slate' }

export default function EmployeesPage() {
  const qc = useQueryClient()
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [country, setCountry] = useState('')
  const [modal, setModal]     = useState(null) // null | 'add' | {employee}
  const [deleting, setDeleting] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, country],
    queryFn: () => getEmployees({ page, page_size: 15, search, country }),
    placeholderData: (prev) => prev,
  })

  const createMut = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => { qc.invalidateQueries(['employees']); setModal(null) },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => { qc.invalidateQueries(['employees']); setModal(null) },
  })
  const deleteMut = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => { qc.invalidateQueries(['employees']); setDeleting(null) },
  })

  const totalPages = data ? Math.ceil(data.total / 15) : 1

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total?.toLocaleString() ?? '—'} total</p>
        </div>
        <button onClick={() => setModal('add')}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name..."
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        />
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setPage(1) }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        >
          {COUNTRIES.map(c => <option key={c} value={c}>{c || 'All countries'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Name','Job Title','Country','Department','Salary',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
            ) : data?.items?.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No employees found</td></tr>
            ) : data?.items?.map((emp, i) => (
              <tr key={emp.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                      {emp.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-900">{emp.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{emp.job_title}</td>
                <td className="px-4 py-3 text-slate-600">{emp.country}</td>
                <td className="px-4 py-3">
                  {emp.department && <Badge color={deptColor[emp.department] ?? 'slate'}>{emp.department}</Badge>}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  ${emp.salary.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setModal(emp)}
                      className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setDeleting(emp)}
                      className="text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-xs rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 text-xs rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Employee">
        <EmployeeForm
          onSubmit={data => createMut.mutate(data)}
          onCancel={() => setModal(null)}
          loading={createMut.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!modal && modal !== 'add'} onClose={() => setModal(null)} title="Edit Employee">
        <EmployeeForm
          initial={modal !== 'add' ? modal : {}}
          onSubmit={data => updateMut.mutate({ id: modal.id, data })}
          onCancel={() => setModal(null)}
          loading={updateMut.isPending}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Employee">
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <span className="font-medium text-slate-900">{deleting?.full_name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => deleteMut.mutate(deleting?.id)}
            disabled={deleteMut.isPending}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors">
            {deleteMut.isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={() => setDeleting(null)}
            className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
