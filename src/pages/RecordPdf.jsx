import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const colors = { navy: '#0D1028', gold: '#D4A056', ink: '#1C1C1C', muted: '#6B6B7B', ivory: '#F7F4EF', border: '#EDE8DF' };

const styles = StyleSheet.create({
  page: { padding: 38, fontFamily: 'Helvetica', fontSize: 9, color: colors.ink, backgroundColor: '#FFFFFF' },
  header: { backgroundColor: colors.navy, padding: 22, borderRadius: 8, marginBottom: 18 },
  eyebrow: { color: colors.gold, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: '#FFFFFF', fontSize: 22, fontFamily: 'Helvetica-Bold' },
  meta: { color: '#D7D9E3', marginTop: 7 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  scoreCard: { flexGrow: 1, backgroundColor: colors.ivory, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 7 },
  label: { color: colors.muted, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 5 },
  score: { color: colors.navy, fontSize: 18, fontFamily: 'Helvetica-Bold' },
  section: { borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 14, marginBottom: 13 },
  heading: { color: colors.navy, fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 9 },
  paragraph: { lineHeight: 1.55, marginBottom: 8 },
  kv: { flexDirection: 'row', paddingVertical: 3 },
  key: { width: '38%', color: colors.muted, fontFamily: 'Helvetica-Bold' },
  value: { width: '62%' },
  dimRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dimLabel: { width: '45%', color: colors.navy },
  dimValue: { width: '18%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  barTrack: { width: '37%', height: 6, backgroundColor: colors.border, borderRadius: 3, marginLeft: 7 },
  question: { padding: 9, backgroundColor: colors.ivory, borderRadius: 5, marginBottom: 7 },
  answer: { color: colors.navy, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  footer: { position: 'absolute', left: 38, right: 38, bottom: 24, color: colors.muted, fontSize: 7, textAlign: 'center' },
});

const DetailRow = ({ label, value }) => (
  <View style={styles.kv}>
    <Text style={styles.key}>{label}</Text>
    <Text style={styles.value}>{value ?? '—'}</Text>
  </View>
);

export default function RecordPdf({ config, record, type, summary, questions, answers, dimLabels }) {
  const isClarity = type === 'clarity';
  const isTool = type === 'readiness' || type === 'execution';
  const score = isClarity ? summary.clarityScore : summary.toolResults?.score ?? record.score;
  const band = isClarity ? summary.band?.label : summary.toolResults?.band?.label ?? record.band;

  return (
    <Document title={`${record.firstName} ${record.lastName} — ${config.label}`} author="Phoenix Clear Insight">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PHOENIX COACH CONSOLE · CONFIDENTIAL</Text>
          <Text style={styles.title}>{config.label}</Text>
          <Text style={styles.meta}>{record.firstName} {record.lastName} · {record.email} · {record.date ? new Date(record.date).toLocaleString() : '—'}</Text>
        </View>

        {config.isTestimonial ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Story Submission</Text>
            <DetailRow label="Clarity Band" value={record.band || record.stage} />
            <DetailRow label="Band Source" value={record.bandSource || 'self-reported'} />
            <DetailRow label="Segment" value={record.segment} />
            <DetailRow label="Status" value={record.status} />
            <Text style={styles.heading}>Before</Text><Text style={styles.paragraph}>{record.before || '—'}</Text>
            <Text style={styles.heading}>The Shift</Text><Text style={styles.paragraph}>{record.shift || '—'}</Text>
            <Text style={styles.heading}>After</Text><Text style={styles.paragraph}>{record.after || '—'}</Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <View style={styles.scoreCard}><Text style={styles.label}>{isClarity ? 'CLARITY SCORE' : 'SCORE'}</Text><Text style={styles.score}>{score ?? '—'}{isClarity ? ' / 100' : '%'}</Text></View>
              <View style={styles.scoreCard}><Text style={styles.label}>BAND</Text><Text style={styles.score}>{band || '—'}</Text></View>
              {summary.toolResults?.gap && <View style={styles.scoreCard}><Text style={styles.label}>GAP</Text><Text style={styles.score}>{summary.toolResults.gap.archetype}</Text></View>}
            </View>

            {isClarity && summary.band && <View style={styles.section}><Text style={styles.heading}>Scoring Band Narrative — {summary.band.label}</Text><Text style={styles.paragraph}>{summary.band.intro}</Text><Text style={styles.paragraph}>{summary.band.directRead}</Text></View>}

            {isClarity && summary.categoryScores && <View style={styles.section}>
              <Text style={styles.heading}>Five Dimensions</Text>
              {summary.categoryScores.map((scoreValue, index) => <View style={styles.dimRow} key={dimLabels[index]}><Text style={styles.dimLabel}>{dimLabels[index]}</Text><View style={styles.barTrack} /><Text style={styles.dimValue}>{scoreValue} / 20</Text></View>)}
            </View>}

            {isClarity && <View style={styles.section}>
              <Text style={styles.heading}>Coach Signals</Text>
              <DetailRow label="Position" value={summary.position?.quadrant} />
              <DetailRow label="Friction Vector" value={summary.frictionVector?.archetype} />
              <DetailRow label="Growth Edge" value={summary.growthEdge ? `${dimLabels[summary.growthEdge.index]} (${summary.growthEdge.score} / 20)` : null} />
            </View>}

            {isTool && summary.toolResults && <View style={styles.section}>
              <Text style={styles.heading}>{type === 'readiness' ? 'Readiness' : 'Execution'} Profile</Text>
              <DetailRow label="Band" value={summary.toolResults.band?.label} />
              <DetailRow label="Gap" value={summary.toolResults.gap?.archetype} />
              <DetailRow label="Lowest Category" value={summary.toolResults.gap?.category} />
            </View>}
          </>
        )}
        <Text style={styles.footer}>Phoenix Clear Insight Consulting LLC · Generated {new Date().toLocaleDateString()}</Text>
      </Page>

      {answers.length > 0 && questions.length > 0 && <Page size="LETTER" style={styles.page}>
        <Text style={styles.heading}>Question-by-Question Responses</Text>
        {questions.map((question, index) => <View style={styles.question} key={`${index}-${question}`}><Text>{index + 1}. {question}</Text><Text style={styles.answer}>Response: {answers[index] ?? '—'} / 5</Text></View>)}
        <Text style={styles.footer}>Phoenix Clear Insight Consulting LLC · Confidential record</Text>
      </Page>}
    </Document>
  );
}
