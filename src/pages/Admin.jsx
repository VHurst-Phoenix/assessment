import { useEffect, useMemo, useState } from 'react'
import db from '../db'
import { exportAssessmentsToExcel } from '../utils/exportExcel'

const COACH_CODE = 'phoenix2026'

export default function Admin() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('coachAuth') === 'true')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [dbError, setDbError] = useState('')

  useEffect(() => {
    let mounted = true
    const loadAssessments = async () => {
      try {
        if (!db || !db.assessments) {
          throw new Error('Database not initialized')
        }
        const all = await db.assessments.toArray()
        if (mounted) {
          setItems(all.reverse())
          setDbError('')
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load assessments from IndexedDB:', err)
          setDbError('Failed to load assessments. Please refresh the page.')
        }
      }
    }
    loadAssessments()
    return () => {
      mounted = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.firstName || ''} ${item.lastName || ''} ${item.email || ''} ${item.context || ''}`.toLowerCase()
      if (search && !text.includes(search.toLowerCase())) {
        return false
      }

      if (minScore && Number(item.score) < Number(minScore)) {
        return false
      }
      if (maxScore && Number(item.score) > Number(maxScore)) {
        return false
      }

      if (dateFrom) {
        const fromValue = new Date(dateFrom).setHours(0, 0, 0, 0)
        const itemValue = new Date(item.createdAt).setHours(0, 0, 0, 0)
        if (itemValue < fromValue) return false
      }
      if (dateTo) {
        const toValue = new Date(dateTo).setHours(23, 59, 59, 999)
        const itemValue = new Date(item.createdAt).getTime()
        if (itemValue > toValue) return false
      }
      return true
    })
  }, [items, search, minScore, maxScore, dateFrom, dateTo])

  const total = filteredItems.length
  const average = total ? (filteredItems.reduce((sum, item) => sum + (item.score || 0), 0) / total).toFixed(1) : '0.0'

  function handleLogin(e) {
    e.preventDefault()
    if (password.trim() === COACH_CODE) {
      localStorage.setItem('coachAuth', 'true')
      setAuthenticated(true)
      setAuthError('')
      setPassword('')
      return
    }
    setAuthError('Incorrect code. Try again.')
  }

  function handleLogout() {
    localStorage.removeItem('coachAuth')
    setAuthenticated(false)
  }

  return (
    <section className="admin">
      <div className="hero hero-small">
        <div className="hero-label">Coach View · Admin Dashboard</div>
        <h1>Assessment Submissions</h1>
        <p>
          Review stored assessments, filter results, and export the client data you need.
        </p>
      </div>

      <div className="container">
        {!authenticated ? (
          <div className="admin-login-card">
            <h2>Coach Access</h2>
            <p>Enter the coach access code to view assessment submissions and export data.</p>
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter coach access code"
              />
              <button type="submit" className="btn btn-primary">
                Unlock Coach Dashboard
              </button>
            </form>
            {authError && <div className="form-error">{authError}</div>}
          </div>
        ) : (
          <div className="admin-panel">
            {dbError && (
              <div className="form-error" role="alert" style={{ marginBottom: '20px' }}>
                <strong>Database Error:</strong> {dbError}
              </div>
            )}
            <div className="admin-summary">
              <div className="admin-summary-card">
                <h3>Total visible submissions</h3>
                <p>{total}</p>
              </div>
              <div className="admin-summary-card">
                <h3>Average clarity score</h3>
                <p>{average}</p>
              </div>
              <div className="admin-summary-card">
                <h3>Last updated</h3>
                <p>{items[0] ? new Date(items[0].createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>

            <div className="admin-filters">
              <div className="admin-filter-group">
                <label>Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, notes..."
                />
              </div>
              <div className="admin-filter-group">
                <label>Min score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="admin-filter-group">
                <label>Max score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="admin-filter-group">
                <label>From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="admin-filter-group">
                <label>To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="admin-actions">
              <button className="btn btn-primary" onClick={() => exportAssessmentsToExcel(filteredItems)}>
                Export filtered results
              </button>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{`${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown'}</td>
                        <td>{item.email || '—'}</td>
                        <td>{item.score}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No submissions match the current filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
