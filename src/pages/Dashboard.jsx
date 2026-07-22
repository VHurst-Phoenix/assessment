import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { env } from '../config/env';
import {
  fetchAllRows,
  listAssessments,
  listExecutionForms,
  listReadiness,
  listTestimonials,
  updateTestimonialStatus,
  deleteTestimonial,
  deleteAssessment,
  deleteReadiness,
  deleteExecutionForm,
} from '../api/dbClient';
import { getSupabaseClient } from '../lib/supabaseClient';
import { downloadCsv } from '../utils/csvExport';
import './Dashboard.css';

const tableByTab = {
  clarity: env.supabaseAssessmentsTable,
  readiness: env.supabaseReadinessTable,
  execution: env.supabaseExecutionFormsTable,
  testimonials: env.supabaseTestimonialsTable,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clarity');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getData = useCallback(async () => {
    if (activeTab === 'clarity') {
      return listAssessments();
    }
    if (activeTab === 'readiness') {
      return listReadiness();
    }
    if (activeTab === 'execution') {
      return listExecutionForms();
    }
    if (activeTab === 'testimonials') {
      return listTestimonials();
    }
    return [];
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const result = await getData();
        if (isMounted) setData(result);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setData([]);
          setError(err.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [getData]);

  const handleLogout = async () => {
    const { client } = getSupabaseClient();
    await client?.auth.signOut();
    navigate('/login');
  };

  const exportAllRowsToCsv = async () => {
    const tableName = tableByTab[activeTab];

    if (!tableName) {
      setError(`No Supabase table is configured for ${activeTab}.`);
      return;
    }

    setIsExporting(true);
    setError('');

    try {
      const rows = await fetchAllRows(tableName);

      if (rows.length === 0) {
        setError(`No rows found in ${tableName}.`);
        return;
      }

      downloadCsv(rows, `Phoenix_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error(err);
      setError(err.message || `Unable to export ${tableName}.`);
    } finally {
      setIsExporting(false);
    }
  };

  const approveTestimonial = async (id) => {
    try {
      setError('');
      // Optimistically update the UI
      setData(data.map(item =>
        item.id === id ? { ...item, status: 'Approved' } : item
      ));
      await updateTestimonialStatus(id, 'Approved');
      // Refresh in case there were concurrent updates
      setData(await getData());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to approve testimonial.');
      // Refetch to restore correct state on error
      setData(await getData());
    }
  };

  const rejectTestimonial = async (id) => {
    try {
      setError('');
      // Optimistically update the UI
      setData(data.map(item =>
        item.id === id ? { ...item, status: 'Rejected' } : item
      ));
      await updateTestimonialStatus(id, 'Rejected');
      // Refresh in case there were concurrent updates
      setData(await getData());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to reject testimonial.');
      // Refetch to restore correct state on error
      setData(await getData());
    }
  };

  // Generic delete handler for any record type
  const deleteItemHandler = async (id) => {
    try {
      setError('');
      setConfirmDeleteId(null);
      // Optimistically remove from UI
      setData(data.filter(item => item.id !== id));
      // Call appropriate delete function based on active tab
      if (activeTab === 'testimonials') {
        await deleteTestimonial(id);
      } else if (activeTab === 'clarity') {
        await deleteAssessment(id);
      } else if (activeTab === 'readiness') {
        await deleteReadiness(id);
      } else if (activeTab === 'execution') {
        await deleteExecutionForm(id);
      }
      // Refresh list to ensure consistency
      setData(await getData());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to delete record.');
      // Refetch to restore UI if deletion failed
      setData(await getData());
    }
  };

  const totalRecords = data.length;
  const scoredRecords = data.filter(item => item.score !== undefined && item.score !== null);
  const averageScore = data.length
    ? Math.round(scoredRecords.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / scoredRecords.length)
    : 0;
  const pendingTestimonials = activeTab === 'testimonials'
    ? data.filter(item => item.status === 'Pending Review').length
    : 0;
  const latestRecord = data.length
    ? data.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const tabs = [
    { key: 'clarity', label: 'Clarity', count: activeTab === 'clarity' ? totalRecords : null },
    { key: 'readiness', label: 'Readiness', count: activeTab === 'readiness' ? totalRecords : null },
    { key: 'execution', label: 'Execution', count: activeTab === 'execution' ? totalRecords : null },
    { key: 'testimonials', label: 'Testimonials', count: activeTab === 'testimonials' ? totalRecords : null },
  ];

  return (
    <div className="animate-fade-slide">
      <div className="hero">
        <div className="hero-label">Phoenix Coach Console</div>
        <h1><em>Dashboard</em></h1>
        <p>Review assessment records, export client data, and manage stories from one focused workspace.</p>
        <div className="admin-actions" style={{ marginTop: '12px' }}>
          <button onClick={exportAllRowsToCsv} className="btn btn-gold" disabled={isExporting}>
            {isExporting ? 'Exporting...' : `Export all ${activeTab}`}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </div>

      <div className="admin-shell">

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Records</span>
          <strong>{totalRecords}</strong>
        </div>
        <div className="admin-stat-card">
          <span>{activeTab === 'testimonials' ? 'Pending Review' : 'Average Score'}</span>
          <strong>
            {activeTab === 'testimonials'
              ? pendingTestimonials
              : activeTab === 'clarity'
                ? `${Number.isFinite(averageScore) ? averageScore : 0} / 125`
                : `${Number.isFinite(averageScore) ? averageScore : 0}%`}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span>Latest Entry</span>
          <strong>{latestRecord ? new Date(latestRecord.date).toLocaleDateString() : '—'}</strong>
        </div>
      </div>

      <div className="admin-tabs" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`admin-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== null && <span>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="admin-table-card">
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        <div className="admin-table-header">
          <div>
            <div className="admin-table-label">{activeTab}</div>
            <h3>{activeTab === 'testimonials' ? 'Story Submissions' : 'Assessment Records'}</h3>
          </div>
          <div className="admin-table-meta">{totalRecords} {totalRecords === 1 ? 'record' : 'records'}</div>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Name</th>
              {(activeTab === 'clarity' || activeTab === 'readiness' || activeTab === 'execution') && <th>Score</th>}
              {activeTab === 'clarity' && <th>Scoring Band</th>}
              {activeTab === 'testimonials' && <th>Stage</th>}
              {activeTab === 'testimonials' && <th>Status</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8">
                  <div className="admin-empty">
                    <div>Loading {activeTab} records...</div>
                    <p>Please wait while the dashboard connects to Supabase.</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="admin-empty">
                    <div>No data available for {activeTab}.</div>
                    <p>New submissions will appear here as soon as they are saved.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>
                    <Link
                      to={`/dashboard/record/${activeTab}/${item.id}`}
                      className="name-link"
                      title="View full details"
                    >
                      {item.firstName} {item.lastName}
                    </Link>
                  </td>
                  {(activeTab === 'clarity' || activeTab === 'readiness' || activeTab === 'execution') && (
                    <td>
                      <span className="score-badge">
                        {activeTab === 'clarity' ? `${item.score} / 125` : `${item.score}%`}
                      </span>
                    </td>
                  )}
                  {activeTab === 'clarity' && <td>{item.archetypeName || item.archetype}</td>}
                  {activeTab === 'testimonials' && <td>{item.stage}</td>}
                  {activeTab === 'testimonials' && (
                    <td>
                      <span className={`status-pill status-${(item.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.status}
                      </span>
                    </td>
                  )}
                  <td>
                    <div className="row-actions">
                      {activeTab === 'testimonials' && item.status === 'Pending Review' && (
                        <>
                          <button onClick={() => approveTestimonial(item.id)} className="mini-btn approve">Approve</button>
                          <button onClick={() => rejectTestimonial(item.id)} className="mini-btn reject">Reject</button>
                        </>
                      )}
                      {confirmDeleteId === item.id ? (
                        <div className="delete-confirm-inline">
                          <span className="delete-confirm-label">Delete?</span>
                          <button onClick={() => deleteItemHandler(item.id)} className="mini-btn delete-yes">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="mini-btn delete-no">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(item.id)} className="mini-btn delete" title="Delete this record">🗑 Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;