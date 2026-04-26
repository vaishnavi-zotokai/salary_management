import { Routes, Route, NavLink } from 'react-router-dom'
import EmployeesPage from './pages/EmployeesPage'
import InsightsPage from './pages/InsightsPage'

const NAV_H = 56

const S = {
  root: {
    height: '100vh', width: '100%', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  nav: {
    height: NAV_H, flexShrink: 0,
    background: '#ffffff', borderBottom: '1px solid #e2e8f0',
    padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', zIndex: 50,
  },
  logoBox: {
    width: 32, height: 32, background: '#4f46e5', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(79,70,229,0.3)', flexShrink: 0,
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4 },
  // main fills whatever height remains; each route owns its own layout
  main: { flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={S.logoBox}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3"    y="10" width="2.5" height="5"  rx="0.5" fill="white" />
          <rect x="7.75" y="6"  width="2.5" height="9"  rx="0.5" fill="white" />
          <rect x="12.5" y="3"  width="2.5" height="12" rx="0.5" fill="white" />
        </svg>
      </div>
      <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.04em' }}>
        Ledgr
      </span>
    </div>
  )
}

function NavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        padding: '6px 14px', borderRadius: 8,
        fontSize: 14, fontWeight: 500, textDecoration: 'none',
        background: isActive ? '#eef2ff' : 'transparent',
        color: isActive ? '#4338ca' : '#64748b',
        transition: 'background 0.15s, color 0.15s',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.style.background.includes('eef')) {
          e.currentTarget.style.background = '#f1f5f9'
          e.currentTarget.style.color = '#0f172a'
        }
      }}
      onMouseLeave={e => {
        if (e.currentTarget.style.background === '#f1f5f9') {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#64748b'
        }
      }}
    >
      {children}
    </NavLink>
  )
}

export default function App() {
  return (
    <div style={S.root}>
      <nav style={S.nav}>
        <Logo />
        <div style={S.navLinks}>
          <NavItem to="/" end>Employees</NavItem>
          <NavItem to="/insights">Insights</NavItem>
        </div>
      </nav>

      {/* Each route fills this container fully */}
      <main style={S.main}>
        <Routes>
          <Route path="/"        element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  )
}
