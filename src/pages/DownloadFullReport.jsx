import { PDFDownloadLink } from '@react-pdf/renderer';
import ClarityReportPdf from './ClarityReportPdf';

// Coach-only: builds the Complete Clarity Report PDF from the stored record
// and downloads it. Releasing it to the client is a separate, deliberate step.
export default function DownloadFullReport({ record, className = 'btn btn-gold' }) {
  const fileName = `Phoenix_Clarity_Report_${record.firstName || ''}_${record.lastName || ''}.pdf`.replace(/\s+/g, '_');
  return (
    <PDFDownloadLink className={className} fileName={fileName} document={<ClarityReportPdf record={record} />}>
      {({ loading }) => (loading ? 'Preparing report…' : '📄 Download full report (PDF)')}
    </PDFDownloadLink>
  );
}
