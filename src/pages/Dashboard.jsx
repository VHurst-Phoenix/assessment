import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
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
import { formatPercent } from './toolScoring';
import { dimLabels } from './assessmentQuestions';
import { getFrictionVector, getGrowthEdge, getPosition } from './scoringBands';
import { findTestimonialMatches } from '../utils/testimonialMatching';
import './Dashboard.css';

const PAGE_SIZE = 8;

const bandOrder = {
  clarity: ['Transitioner', 'Strategist', 'Executor', 'Phoenix'],
  readiness: ['Guarded', 'Developing', 'Willing', 'All In'],
  execution: ['Friction-Bound', 'Emergent Traction', 'Operational Cadence', 'Strategic Velocity'],
};

const tabConfig = {
  clarity: { label: 'Clarity', collection: 'Assessment records' },
  readiness: { label: 'Readiness', collection: 'Readiness records' },
  execution: { label: 'Execution', collection: 'Execution records' },
  testimonials: { label: 'Testimonials', collection: 'Story submissions' },
};

const getClaritySignals = (record) => {
  const categoryScores = record.categoryScores?.length === 5 ? record.categoryScores : record.dimScores;
  const position = getPosition(categoryScores);
  return {
    position,
    frictionVector: getFrictionVector(categoryScores, position),
    growthEdge: getGrowthEdge(categoryScores),
  };
};

const getName = (record) => {
  if (record.anonymous === 'Yes') return 'Anonymous submission';
  return [record.firstName, record.lastName].filter(Boolean).join(' ') || 'Unnamed record';
};

const formatDate = (date, options = {}) => {
  if (!date || Number.isNaN(new Date(date).getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...options }).format(new Date(date));
};

const scoreValue = (record) => Number(record.score ?? -1);

const formatScore = (record, tab) => {
  if (record.score === null || record.score === undefined) return '—';
  return tab === 'clarity' ? `${record.score} / 100` : formatPercent(record.score);
};

const statusClass = (status) => `status-${(status || 'unknown').toLowerCase().replace(/\s+/g, '-')}`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clarity');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [approvedTestimonials, setApprovedTestimonials] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const requestIdRef = useRef(0);

  const getData = useCallback(async () => {
    if (activeTab === 'clarity') return listAssessments();
    if (activeTab === 'readiness') return listReadiness();
    if (activeTab === 'execution') return listExecutionForms();
    return listTestimonials();
  }, [activeTab]);

  const loadData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError('');
    try {
      const result = await getData();
      if (requestId === requestIdRef.current) setData(result || []);
    } catch (err) {
      console.error(err);
      if (requestId === requestIdRef.current) {
        setData([]);
        setError(err.message || 'Unable to load dashboard data.');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [getData]);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadData]);

  useEffect(() => {
    if (activeTab !== 'clarity') return undefined;
    let isMounted = true;
    listTestimonials({ status: 'Approved' })
      .then((stories) => { if (isMounted) setApprovedTestimonials(stories || []); })
      .catch((err) => { if (isMounted) setError(err.message || 'Unable to load testimonial matches.'); });
    return () => { isMounted = false; };
  }, [activeTab]);

  const bandOptions = useMemo(() => [...new Set(data.map((item) => item.archetypeName || item.archetype || item.band).filter(Boolean))], [data]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = data.filter((item) => {
      const searchable = [getName(item), item.email, item.company, item.segment, item.band, item.archetypeName, item.gap, item.status].filter(Boolean).join(' ').toLowerCase();
      const label = item.archetypeName || item.archetype || item.band || '';
      return (!query || searchable.includes(query))
        && (!selectedSegment || item.segment === selectedSegment)
        && (!selectedStatus || (activeTab === 'testimonials' ? item.status === selectedStatus : label === selectedStatus));
    });
    return matches.sort((first, second) => {
      if (sort === 'name-asc') return getName(first).localeCompare(getName(second));
      if (sort === 'score-desc') return scoreValue(second) - scoreValue(first);
      if (sort === 'score-asc') return scoreValue(first) - scoreValue(second);
      return new Date(second.date).getTime() - new Date(first.date).getTime();
    });
  }, [activeTab, data, search, selectedSegment, selectedStatus, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedRecord = filteredData.find((item) => String(item.id) === String(selectedId)) || filteredData[0] || null;
  const totalRecords = filteredData.length;
  const scoredRecords = filteredData.filter((item) => item.score !== undefined && item.score !== null);
  const averageScore = scoredRecords.length ? Math.round(scoredRecords.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / scoredRecords.length) : 0;
  const pendingTestimonials = filteredData.filter((item) => item.status === 'Pending Review').length;
  const analytics = (() => {
    if (activeTab === 'testimonials') {
      const reviewed = filteredData.filter((item) => item.status === 'Approved' || item.status === 'Rejected');
      const approved = reviewed.filter((item) => item.status === 'Approved').length;
      return { value: reviewed.length ? `${Math.round((approved / reviewed.length) * 100)}%` : '—', detail: reviewed.length ? 'Approval rate for reviewed stories' : 'No reviewed stories yet' };
    }
    const labels = filteredData.map((item) => item.archetypeName || item.archetype || item.band).filter(Boolean);
    const counts = labels.reduce((summary, label) => ({ ...summary, [label]: (summary[label] || 0) + 1 }), {});
    const [topBand, count = 0] = Object.entries(counts).sort(([, first], [, second]) => second - first)[0] || [];
    return { value: topBand || '—', detail: count ? `${count} of ${totalRecords} visible records` : 'No band data available' };
  })();
  const bandDistribution = (() => {
    const labels = filteredData.map((item) => item.archetypeName || item.archetype || item.band).filter(Boolean);
    const counts = labels.reduce((summary, label) => ({ ...summary, [label]: (summary[label] || 0) + 1 }), {});
    const ordered = bandOrder[activeTab] || Object.keys(counts);
    const entries = ordered.map((label) => ({ label, count: counts[label] || 0 }));
    return { entries, max: Math.max(...entries.map((entry) => entry.count), 1) };
  })();
  const latestRecord = filteredData.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const segmentSummary = ['Individual', 'Corporate', 'Federal'].map((segment) => ({ segment, count: filteredData.filter((item) => item.segment === segment).length }));
  const maxSegmentCount = Math.max(...segmentSummary.map(({ count }) => count), 1);
  const tabs = Object.entries(tabConfig).map(([key, config]) => ({ key, label: config.label, count: key === activeTab ? totalRecords : null }));

  const handleLogout = async () => {
    try { const { client } = getSupabaseClient(); await client?.auth.signOut(); } catch (err) { console.warn('Sign out error:', err); } finally { navigate('/login'); }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setSelectedSegment('');
    setSelectedStatus('');
    setSort('date-desc');
    setPage(1);
    setSelectedId(null);
    setConfirmDeleteId(null);
  };

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const exportFilteredRows = async () => {
    if (filteredData.length === 0) { setError('There are no visible records to export. Adjust the current filters and try again.'); return; }
    setIsExporting(true); setError('');
    try {
      const scope = [activeTab, selectedSegment || 'all', selectedStatus || 'records'].join('_').replace(/\s+/g, '-').toLowerCase();
      downloadCsv(filteredData, `Phoenix_${scope}_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) { console.error(err); setError(err.message || 'Unable to export the current view.'); } finally { setIsExporting(false); }
  };

  const updateTestimonial = async (id, status) => {
    try {
      setError('');
      setData((records) => records.map((item) => (item.id === id ? { ...item, status } : item)));
      await updateTestimonialStatus(id, status);
      await loadData();
    } catch (err) { console.error(err); setError(err.message || `Unable to mark testimonial as ${status.toLowerCase()}.`); await loadData(); }
  };

  const deleteItemHandler = async (id) => {
    try {
      setError(''); setConfirmDeleteId(null); setData((records) => records.filter((item) => item.id !== id));
      if (activeTab === 'testimonials') await deleteTestimonial(id);
      if (activeTab === 'clarity') await deleteAssessment(id);
      if (activeTab === 'readiness') await deleteReadiness(id);
      if (activeTab === 'execution') await deleteExecutionForm(id);
      await loadData();
    } catch (err) { console.error(err); setError(err.message || 'Unable to delete this record.'); await loadData(); }
  };

  const selectedSignals = activeTab === 'clarity' && selectedRecord ? getClaritySignals(selectedRecord) : null;
  const selectedCategories = selectedRecord?.categoryScores?.length ? selectedRecord.categoryScores : selectedRecord?.dimScores || [];
  const selectedMatches = activeTab === 'clarity' && selectedRecord ? findTestimonialMatches({ band: selectedRecord.archetypeName || selectedRecord.archetype, segment: selectedRecord.segment }, approvedTestimonials) : null;

  return (
    <div className="dashboard-page animate-fade-slide">
      <section className="dashboard-hero"><div className="dashboard-hero-inner"><div><div className="dashboard-kicker">Phoenix Coach Console</div><h1>Client <em>dashboard</em></h1><p>Review client signals, manage submissions, and move from overview to meaningful client detail.</p></div><div className="dashboard-hero-actions"><button type="button" onClick={exportFilteredRows} className="btn btn-gold" disabled={isExporting || isLoading}>{isExporting ? 'Exporting…' : 'Export current view'}</button><button type="button" onClick={handleLogout} className="dashboard-logout">Log out</button></div></div></section>
      <nav className="dashboard-tabs" aria-label="Dashboard data type"><div className="dashboard-tabs-inner" role="tablist">{tabs.map((tab) => <button type="button" key={tab.key} role="tab" aria-selected={activeTab === tab.key} className={`dashboard-tab ${activeTab === tab.key ? 'is-active' : ''}`} onClick={() => switchTab(tab.key)}>{tab.label}{tab.count !== null && <span>{tab.count}</span>}</button>)}</div></nav>

      <main className="dashboard-shell">
        <section className="dashboard-overview dashboard-cohort-bar" aria-label={tabConfig[activeTab].label + ' cohort intelligence'}>
          <article className="overview-card overview-card-primary"><span className="overview-label">Total records</span><strong>{totalRecords}</strong><small>{search || selectedSegment || selectedStatus ? 'Matching current filters' : 'Across this collection'}</small></article>
          <article className="overview-card"><span className="overview-label">{activeTab === 'testimonials' ? 'Pending review' : 'Average score'}</span><strong>{activeTab === 'testimonials' ? pendingTestimonials : activeTab === 'clarity' ? String(averageScore) : String(averageScore) + '%'}</strong><small>{activeTab === 'testimonials' ? 'Stories awaiting a decision' : activeTab === 'clarity' ? 'Out of 100 points' : 'Across scored records'}</small></article>
          {activeTab !== 'testimonials' && <article className="overview-card dashboard-band-distribution"><span className="overview-label">Band distribution</span><div className="band-distribution-bars">{bandDistribution.entries.map((entry, index) => <div className="band-distribution-column" key={entry.label}><i className={'band-distribution-fill band-step-' + (index + 1)} style={{ height: Math.max(8, (entry.count / bandDistribution.max) * 44) }} /><b>{entry.count}</b><small>{entry.label}</small></div>)}</div></article>}
          <article className="overview-card overview-card-analytics"><span className="overview-label">Analytics</span><strong>{analytics.value}</strong><small>{analytics.detail}</small></article>
          <article className="overview-card overview-card-latest"><span className="overview-label">Latest received</span><strong>{latestRecord ? formatDate(latestRecord.date, { month: 'short', day: 'numeric' }) : '—'}</strong><small>{latestRecord ? getName(latestRecord) : 'No submissions yet'}</small></article>
        </section>

        <section className="dashboard-controls" aria-label="Record controls">
          <label className="dashboard-search" htmlFor="dashboard-search"><span className="sr-only">Search records</span><span aria-hidden="true">⌕</span><input id="dashboard-search" type="search" value={search} onChange={updateFilter(setSearch)} placeholder="Search name, email, company…" /></label>
          <label className="dashboard-select-label" htmlFor="dashboard-segment"><span>Segment</span><select id="dashboard-segment" value={selectedSegment} onChange={updateFilter(setSelectedSegment)}><option value="">All segments</option><option value="Individual">Individual</option><option value="Corporate">Corporate</option><option value="Federal">Federal</option></select></label>
          <label className="dashboard-select-label" htmlFor="dashboard-status"><span>{activeTab === 'testimonials' ? 'Status' : 'Band'}</span><select id="dashboard-status" value={selectedStatus} onChange={updateFilter(setSelectedStatus)}><option value="">{activeTab === 'testimonials' ? 'All statuses' : 'All bands'}</option>{activeTab === 'testimonials' ? ['Pending Review', 'Approved', 'Rejected'].map((status) => <option key={status} value={status}>{status}</option>) : bandOptions.map((band) => <option key={band} value={band}>{band}</option>)}</select></label>
          <label className="dashboard-select-label dashboard-sort-label" htmlFor="dashboard-sort"><span>Sort</span><select id="dashboard-sort" value={sort} onChange={updateFilter(setSort)}><option value="date-desc">Newest first</option><option value="name-asc">Name A–Z</option>{activeTab !== 'testimonials' && <><option value="score-desc">Highest score</option><option value="score-asc">Lowest score</option></>}</select></label>
          <button type="button" className="dashboard-refresh" onClick={loadData} disabled={isLoading} aria-label="Refresh records"><span aria-hidden="true">↻</span> {isLoading ? 'Refreshing' : 'Refresh'}</button>
        </section>
        {error && <div className="dashboard-error" role="alert">{error}</div>}

        <section className="dashboard-workspace">
          <article className="dashboard-panel dashboard-table-panel"><header className="dashboard-panel-header"><div><div className="panel-eyebrow">{tabConfig[activeTab].label}</div><h2>{tabConfig[activeTab].collection}</h2></div><span className="panel-meta">{isLoading ? 'Loading…' : `${totalRecords} ${totalRecords === 1 ? 'record' : 'records'}`}</span></header><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th className="selection-column"><span className="sr-only">Select</span></th><th>Client</th><th>Submitted</th><th>Segment</th>{activeTab !== 'testimonials' && <th>Score</th>}{activeTab === 'clarity' && <th>Focus signal</th>}{(activeTab === 'readiness' || activeTab === 'execution') && <th>Gap</th>}{activeTab === 'testimonials' && <th>Status</th>}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {isLoading ? <tr><td colSpan="8"><div className="dashboard-empty"><strong>Loading {tabConfig[activeTab].label.toLowerCase()} records…</strong><span>Connecting to your existing Supabase data.</span></div></td></tr> : pageRows.length === 0 ? <tr><td colSpan="8"><div className="dashboard-empty"><strong>No matching records</strong><span>Try clearing a filter or wait for a new submission.</span></div></td></tr> : pageRows.map((item) => { const signals = activeTab === 'clarity' ? getClaritySignals(item) : null; const isSelected = String(selectedId) === String(item.id); return <tr key={item.id} className={isSelected ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}><td className="selection-column"><input type="radio" name="selected-record" aria-label={`Select ${getName(item)}`} checked={isSelected} onChange={() => setSelectedId(item.id)} /></td><td><button type="button" className="record-name" onClick={() => setSelectedId(item.id)}>{getName(item)}<span>{item.company || item.email || 'No contact details'}</span></button></td><td>{formatDate(item.date, { year: undefined })}</td><td><span className={`segment-badge segment-${(item.segment || 'unset').toLowerCase()}`}>{item.segment || 'Unassigned'}</span></td>{activeTab !== 'testimonials' && <td><span className="dashboard-score">{formatScore(item, activeTab)}</span><small className="table-subvalue">{item.archetypeName || item.band || ''}</small></td>}{activeTab === 'clarity' && <td><span className="signal-text">{signals?.growthEdge ? dimLabels[signals.growthEdge.index] : '—'}</span></td>}{(activeTab === 'readiness' || activeTab === 'execution') && <td><span className="signal-text">{item.gap || '—'}</span></td>}{activeTab === 'testimonials' && <td><span className={`status-pill ${statusClass(item.status)}`}>{item.status || 'Unknown'}</span></td>}<td><Link to={`/dashboard/record/${activeTab}/${item.id}`} className="table-open-link" onClick={(event) => event.stopPropagation()} aria-label={`Open ${getName(item)} details`}>Open</Link></td></tr>; })}
          </tbody></table></div><footer className="dashboard-pagination"><span>{totalRecords ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalRecords)} of ${totalRecords}` : '0 records'}</span><div><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>Next</button></div></footer></article>

          <aside className="dashboard-side-panel" aria-live="polite">{selectedRecord ? <article className="dashboard-panel record-focus-panel"><header className="dashboard-panel-header focus-header"><div><div className="panel-eyebrow">Selected record</div><h2>{getName(selectedRecord)}</h2><p>{selectedRecord.company || selectedRecord.email || 'No company provided'} · {formatDate(selectedRecord.date)}</p></div>{activeTab === 'testimonials' ? <span className={`status-pill ${statusClass(selectedRecord.status)}`}>{selectedRecord.status || 'Unknown'}</span> : <span className="focus-type">{tabConfig[activeTab].label}</span>}</header><div className="focus-content">
            {activeTab === 'clarity' && <><div className="focus-output-grid"><div><span>Score</span><strong>{formatScore(selectedRecord, activeTab)}</strong></div><div><span>Band</span><strong>{selectedRecord.archetypeName || selectedRecord.archetype || '—'}</strong></div><div><span>Position</span><strong>{selectedSignals?.position?.quadrant || '—'}</strong></div><div><span>Growth edge</span><strong>{selectedSignals?.growthEdge ? dimLabels[selectedSignals.growthEdge.index] : '—'}</strong></div></div><section className="focus-section"><h3>Dimension profile</h3>{selectedCategories.length ? selectedCategories.map((score, index) => <div className="dimension-row" key={dimLabels[index] || index}><span>{dimLabels[index] || `Dimension ${index + 1}`}</span><div><i style={{ width: `${Math.min(100, Math.max(0, (Number(score) / 20) * 100))}%` }} /></div><b>{Number(score).toFixed(0)}</b></div>) : <p className="focus-muted">Dimension responses are unavailable for this record.</p>}</section><section className="focus-callout"><span>Friction vector</span><strong>{selectedSignals?.frictionVector?.archetype || 'Not available'}</strong>{selectedMatches && <small>{selectedMatches.tier1.length + selectedMatches.tier2.length} approved story match{selectedMatches.tier1.length + selectedMatches.tier2.length === 1 ? '' : 'es'} found</small>}</section></>}
            {(activeTab === 'readiness' || activeTab === 'execution') && <><div className="focus-output-grid"><div><span>Score</span><strong>{formatScore(selectedRecord, activeTab)}</strong></div><div><span>Band</span><strong>{selectedRecord.band || '—'}</strong></div><div><span>Primary gap</span><strong>{selectedRecord.gap || '—'}</strong></div><div><span>{activeTab === 'readiness' ? 'Session' : 'Checkpoint'}</span><strong>{activeTab === 'readiness' ? selectedRecord.sessionType || '—' : selectedRecord.programCheckpoint || '—'}</strong></div></div>{selectedCategories.length > 0 && <section className="focus-section"><h3>Category profile</h3>{selectedCategories.map((score, index) => <div className="dimension-row" key={index}><span>Category {index + 1}</span><div><i style={{ width: `${Math.min(100, Math.max(0, Number(score)))}%` }} /></div><b>{Number(score).toFixed(0)}%</b></div>)}</section>}{activeTab === 'execution' && selectedRecord.notes && <section className="focus-callout"><span>Coach notes</span><strong>{selectedRecord.notes}</strong></section>}</>}
            {activeTab === 'testimonials' && <><div className="focus-output-grid"><div><span>Status</span><strong>{selectedRecord.status || '—'}</strong></div><div><span>Band</span><strong>{selectedRecord.band || '—'}</strong></div><div><span>Source</span><strong>{selectedRecord.bandSource || 'Self-reported'}</strong></div><div><span>Segment</span><strong>{selectedRecord.segment || 'Unassigned'}</strong></div></div><section className="story-preview"><div><span>Before</span><p>{selectedRecord.before || 'No response provided.'}</p></div><div><span>The shift</span><p>{selectedRecord.shift || 'No response provided.'}</p></div><div><span>After</span><p>{selectedRecord.after || 'No response provided.'}</p></div></section></>}
            <div className="focus-actions"><Link to={`/dashboard/record/${activeTab}/${selectedRecord.id}`} className="btn btn-primary">View full record</Link>{activeTab === 'testimonials' && selectedRecord.status === 'Pending Review' && <><button type="button" className="focus-approve" onClick={() => updateTestimonial(selectedRecord.id, 'Approved')}>Approve</button><button type="button" className="focus-reject" onClick={() => updateTestimonial(selectedRecord.id, 'Rejected')}>Reject</button></>}</div><div className="focus-danger-zone">{confirmDeleteId === selectedRecord.id ? <><span>Delete this record?</span><button type="button" onClick={() => deleteItemHandler(selectedRecord.id)}>Yes, delete</button><button type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button></> : <button type="button" onClick={() => setConfirmDeleteId(selectedRecord.id)}>Delete record</button>}</div>
          </div></article> : <article className="dashboard-panel dashboard-empty-focus"><div className="panel-eyebrow">Record context</div><h2>Select a record</h2><p>Choose a row to see its score, signals, and available actions here.</p></article>}
          <article className="dashboard-panel cohort-panel"><header><div className="panel-eyebrow">Cohort pulse</div><h2>Segment distribution</h2></header><div className="cohort-bars">{segmentSummary.map(({ segment, count }) => <div className="cohort-row" key={segment}><span>{segment}</span><div><i style={{ width: `${(count / maxSegmentCount) * 100}%` }} /></div><b>{count}</b></div>)}</div><p>Counts reflect the records currently visible in the table.</p></article></aside>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
