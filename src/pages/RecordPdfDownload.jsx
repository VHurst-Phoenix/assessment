import { PDFDownloadLink } from '@react-pdf/renderer';
import RecordPdf from './RecordPdf';

export default function RecordPdfDownload({ config, record, type, summary, questions, answers, dimLabels }) {
  const safeName = `Phoenix_${type}_${record.firstName}_${record.lastName}.pdf`.replace(/\s+/g, '_');
  return (
    <PDFDownloadLink
      className="btn btn-gold"
      fileName={safeName}
      document={<RecordPdf config={config} record={record} type={type} summary={summary} questions={questions} answers={answers} dimLabels={dimLabels} />}
    >
      {({ loading }) => loading ? 'Preparing PDF…' : '📄 Download PDF'}
    </PDFDownloadLink>
  );
}
