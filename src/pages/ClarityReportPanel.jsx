import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import ClarityReportPdf from './ClarityReportPdf';
import DownloadFullReport from './DownloadFullReport';
import { getClarityReportUrl, releaseClarityReport, storeClarityReport } from '../api/dbClient';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : null);

// Coach-only controls for the Complete Clarity Report: build the client PDF
// from the stored responses, keep it in private storage, and release it to
// the client once they have booked the Clarity Intensive.
export default function ClarityReportPanel({ record, onRecordChange }) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const run = async (label, task) => {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      await task();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  };

  const generateAndStore = () => run('store', async () => {
    const blob = await pdf(<ClarityReportPdf record={record} />).toBlob();
    const updated = await storeClarityReport(record.id, blob);
    onRecordChange({ ...record, ...updated });
    setMessage('Report PDF generated and stored.');
  });

  const openStored = () => run('open', async () => {
    const url = await getClarityReportUrl(record.reportPdfPath);
    window.open(url, '_blank', 'noopener');
  });

  const release = () => {
    const verb = record.reportReleasedAt ? 'Resend' : 'Release';
    const ok = window.confirm(`${verb} the Complete Clarity Report to ${record.email}?\n\nOnly do this once the client has booked and paid for the Clarity Intensive.`);
    if (!ok) return;
    run('release', async () => {
      const result = await releaseClarityReport(record.id);
      onRecordChange({ ...record, reportReleasedAt: result?.releasedAt || new Date().toISOString() });
      setMessage(`Report emailed to ${record.email}.`);
    });
  };

  const status = record.reportReleasedAt
    ? `Released to client · ${formatDateTime(record.reportReleasedAt)}`
    : record.reportPdfPath
      ? `Stored, not yet released · generated ${formatDateTime(record.reportGeneratedAt)}`
      : 'Not generated yet';

  return (
    <div className="record-section clarity-report-panel">
      <h3>Complete Clarity Report (PDF)</h3>
      <p className="clarity-report-status">
        <strong>Status:</strong> {status}
      </p>
      <p className="clarity-report-help">
        The client only received the summary. Download the full report any time for your own review; release it to the client after they book the Clarity Intensive in Acuity.
      </p>
      <div className="clarity-report-actions">
        <DownloadFullReport record={record} />
        <button type="button" className="btn btn-secondary" onClick={generateAndStore} disabled={Boolean(busy)}>
          {busy === 'store' ? 'Generating…' : record.reportPdfPath ? 'Regenerate & store PDF' : 'Generate & store PDF'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={openStored} disabled={Boolean(busy) || !record.reportPdfPath}>
          {busy === 'open' ? 'Opening…' : 'Open stored PDF'}
        </button>
        <button type="button" className="btn btn-gold" onClick={release} disabled={Boolean(busy) || !record.reportPdfPath}>
          {busy === 'release' ? 'Sending…' : record.reportReleasedAt ? 'Resend to client' : 'Release to client'}
        </button>
      </div>
      {message && <p className="clarity-report-message" role="status">{message}</p>}
      {error && <p className="clarity-report-error" role="alert">{error}</p>}
    </div>
  );
}
