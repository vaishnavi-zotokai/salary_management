import { Routes, Route, NavLink } from 'react-router-dom'
import EmployeesPage from './pages/EmployeesPage'
import InsightsPage from './pages/InsightsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-8 sticky top-0 z-50">
        <span className="font-semibold text-slate-900 text-lg tracking-tight">
          💼 SalaryIQ
        </span>
        <div className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Employees
          </NavLink>
          <NavLink
            to="/insights"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            Insights
          </NavLink>
        </div>
      </nav>

      {/* Pages */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  )
}