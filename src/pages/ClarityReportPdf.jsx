import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { buildClarityReport, formatScore } from './clarityReport.js';
import { frictionNarratives, growthEdgeFraming, positionNarratives } from './clarityNarratives.js';
import { MAX_CATEGORY_SCORE } from './scoringBands.js';
import { POSITION_MAX_AXIS_SCORE } from './positionCalc.js';
import { CLARITY_INTENSIVE_URL } from '../config/booking.js';

// The complete, client-facing Clarity Report. Released to the client by the
// coach after they book the Clarity Intensive — never shown on the public
// results page. All narrative comes from clarityNarratives.js / scoringBands.js.

const colors = { navy: '#0D1028', gold: '#D4A056', ink: '#1C1C1C', muted: '#6B6B7B', ivory: '#F7F4EF', border: '#EDE8DF' };
const tierColors = { Emerging: '#8B2635', Developing: '#927200', Strong: '#2D6A4F', Exceptional: '#263B82' };

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 56, paddingHorizontal: 46, fontFamily: 'Helvetica', fontSize: 10, color: colors.ink, lineHeight: 1.55 },
  cover: { backgroundColor: colors.navy, borderRadius: 10, padding: 28, marginBottom: 20 },
  eyebrow: { color: colors.gold, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1.6, marginBottom: 8 },
  coverTitle: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Helvetica-Bold', lineHeight: 1.2, marginBottom: 6 },
  coverMeta: { color: '#D7D9E3', fontSize: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18 },
  scoreBig: { color: '#FFFFFF', fontSize: 44, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  scoreDenom: { color: '#D7D9E3', fontSize: 14, marginLeft: 6, marginBottom: 6 },
  bandPill: { marginLeft: 'auto', backgroundColor: colors.gold, color: colors.navy, fontFamily: 'Helvetica-Bold', fontSize: 13, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 14 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1.4, color: colors.gold, marginBottom: 4 },
  heading: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: colors.navy, lineHeight: 1.25, marginBottom: 8 },
  sub: { fontSize: 9, color: colors.muted, marginBottom: 10 },
  paragraph: { marginBottom: 8 },
  section: { marginBottom: 20 },
  card: { backgroundColor: colors.ivory, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, marginBottom: 12 },
  directRead: { borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 12, fontFamily: 'Helvetica-Oblique' },
  dim: { marginBottom: 14 },
  dimHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dimName: { fontFamily: 'Helvetica-Bold', color: colors.navy, fontSize: 11 },
  dimScore: { fontFamily: 'Helvetica-Bold', color: colors.navy },
  tier: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 4 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 6 },
  fill: { height: 6, backgroundColor: colors.gold, borderRadius: 3 },
  signalName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.navy, lineHeight: 1.25, marginBottom: 6 },
  detail: { fontSize: 9, color: colors.muted, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  cta: { backgroundColor: colors.navy, borderRadius: 10, padding: 22, marginTop: 6 },
  ctaTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Helvetica-Bold', lineHeight: 1.25, marginBottom: 6 },
  ctaText: { color: '#D7D9E3', marginBottom: 10 },
  ctaLink: { color: colors.gold, fontFamily: 'Helvetica-Bold', textDecoration: 'none' },
  footer: { position: 'absolute', left: 46, right: 46, bottom: 18, fontSize: 7.5, lineHeight: 1.4, color: colors.muted, textAlign: 'center' },
});

const paragraphs = (text) => String(text || '').split(/\n\s*\n/).filter(Boolean);

// The report always has exactly three pages, so numbers are passed in: the
// <Text render> page-number API silently drops the whole footer in the
// installed @react-pdf/renderer version.
const REPORT_PAGES = 3;
const Footer = ({ page }) => (
  <View style={styles.footer} fixed>
    <Text>Phoenix Clear Insight Consulting LLC · The Phoenix Clarity Assessment is a reflective coaching tool and has not yet completed formal psychometric validation.</Text>
    <Text>Page {page} of {REPORT_PAGES}</Text>
  </View>
);

export default function ClarityReportPdf({ record }) {
  const report = buildClarityReport(record);
  const name = [report.firstName, report.lastName].filter(Boolean).join(' ');
  const dateLabel = report.date ? new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <Document title={`Phoenix Clarity Report — ${name}`} author="Phoenix Clear Insight" subject="Complete Clarity Report">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.eyebrow}>PHOENIX CLEAR INSIGHT · COMPLETE CLARITY REPORT</Text>
          <Text style={styles.coverTitle}>{name || 'Your Clarity Report'}</Text>
          <Text style={styles.coverMeta}>Assessment completed {dateLabel}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreBig}>{formatScore(report.score)}</Text>
            <Text style={styles.scoreDenom}>/ 100</Text>
            <Text style={styles.bandPill}>{report.band?.label || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR BAND</Text>
          <Text style={styles.heading}>{report.band?.label}</Text>
          {paragraphs(report.band?.intro).map((text, index) => <Text style={styles.paragraph} key={`intro-${index}`}>{text}</Text>)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VETA'S DIRECT READ</Text>
          <View style={styles.directRead}>
            {paragraphs(report.band?.directRead).map((text, index) => <Text style={styles.paragraph} key={`dr-${index}`}>{text}</Text>)}
          </View>
        </View>
        <View style={styles.cta} wrap={false}>
          <Text style={styles.ctaTitle}>Your next step</Text>
          <Text style={styles.ctaText}>Bring this report to your Clarity Intensive. Together we will turn what it surfaced into a specific, actionable direction.</Text>
          <Link src={CLARITY_INTENSIVE_URL} style={styles.ctaLink}>Manage your Clarity Intensive booking »</Link>
        </View>
        <Footer page={1} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>YOUR FIVE DIMENSIONS</Text>
        <Text style={styles.heading}>A detailed read of each dimension</Text>
        <Text style={styles.sub}>Each dimension is scored out of 20.</Text>
        {report.dimensions.map((dimension) => (
          <View style={styles.dim} key={dimension.name} wrap={false}>
            <View style={styles.dimHead}>
              <Text style={styles.dimName}>{dimension.name}</Text>
              <Text style={styles.dimScore}>{formatScore(dimension.score)} / 20</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round((dimension.score / MAX_CATEGORY_SCORE) * 100)}%` }]} />
            </View>
            <Text style={[styles.tier, { color: tierColors[dimension.tier] }]}>{dimension.tier.toUpperCase()}</Text>
            <Text>{dimension.narrative}</Text>
          </View>
        ))}
        <Footer page={2} />
      </Page>

      <Page size="LETTER" style={styles.page}>
        {report.position && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>YOUR POSITION</Text>
            <View style={styles.card}>
              <Text style={styles.signalName}>{report.position.quadrant}</Text>
              <Text style={styles.detail}>
                Inner Clarity (Values + Direction): {formatScore(report.position.innerAxis)} / {POSITION_MAX_AXIS_SCORE}   ·   Outer Action (Strengths + Alignment): {formatScore(report.position.outerAxis)} / {POSITION_MAX_AXIS_SCORE}
              </Text>
              <Text>{positionNarratives[report.position.quadrant]}</Text>
            </View>
          </View>
        )}

        {report.frictionVector && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>YOUR FRICTION VECTOR</Text>
            <View style={styles.card}>
              <Text style={styles.signalName}>{report.frictionVector.archetype}</Text>
              <Text style={styles.detail}>
                Lagging axis: {report.frictionVector.lowerAxis === 'inner' ? 'Inner Clarity' : 'Outer Action'}   ·   Focus dimension: {report.frictionVector.weakerDimension}
              </Text>
              <Text>{frictionNarratives[report.frictionVector.archetype]}</Text>
            </View>
          </View>
        )}

        {report.growthEdge && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>YOUR GROWTH EDGE</Text>
            <View style={styles.card}>
              <Text style={styles.signalName}>{report.growthEdge.name}</Text>
              <Text style={styles.detail}>{formatScore(report.growthEdge.score)} / 20 · {report.growthEdge.tier}</Text>
              <Text style={styles.paragraph}>{growthEdgeFraming}</Text>
              <Text>{report.growthEdge.narrative}</Text>
            </View>
          </View>
        )}

        <Footer page={3} />
      </Page>
    </Document>
  );
}
