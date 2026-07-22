import { Link } from 'react-router-dom';
import './LandingPage.css';

const platformCards = [
  {
    title: 'Clarity Assessment',
    badge: 'Free',
    phase: 'See It',
    body: 'A 25-question assessment across five dimensions of clarity, designed to show where you are and what your next chapter requires.',
    to: '/assessment',
    action: 'Begin Assessment'
  },
  {
    title: 'Readiness Assessment',
    badge: 'Premium',
    phase: 'Believe It',
    body: 'An internal coach evaluation for identity confidence, emotional capacity, and commitment before deeper transformation work.',
    to: '/assessment?mode=coach&assessment=readiness',
    action: 'Begin Assessment'
  },
  {
    title: 'Execution Assessment',
    badge: 'Week 3',
    phase: 'Achieve It',
    body: 'A progress check for follow-through, aligned action, resilience, and the client’s ability to sustain momentum.',
    to: '/assessment?mode=coach&assessment=execution',
    action: 'Begin Assessment'
  }
];

const LandingPage = () => {
  return (
    <div className="landing-page animate-fade-slide">
      <nav className="tab-nav" aria-label="Assessment platform navigation">
        <Link className="tab-btn" to="/assessment">
          Clarity assessment <span className="tab-badge">Free</span>
        </Link>
        <Link className="tab-btn" to="/assessment?mode=coach">
          readiness assessment <span className="tab-badge">Premium</span>
        </Link>
        <Link className="tab-btn" to="/assessment?mode=coach">
          execution assessment <span className="tab-badge">Week 3</span>
        </Link>
        <Link className="tab-btn" to="/assessment?share=story">
          testimonials
        </Link>
      </nav>

      <section className="hero landing-hero">
        <div className="hero-label">See It · Phase 1 of 3</div>
        <h1>The Phoenix<br /><em>Clarity Assessment</em></h1>
        <p>
          25 questions. ~7 minutes. You’ll get a clear snapshot of where you are right now
          — and what your next chapter actually requires.
        </p>
        <div className="landing-hero-meta">
          <span><span className="dot"></span>25 Questions</span>
          <span><span className="dot"></span>5 Dimensions</span>
          <span><span className="dot"></span>Free · No obligation</span>
        </div>
        <div className="landing-hero-actions">
          <Link to="/assessment" className="btn btn-gold">Begin My Clarity Assessment →</Link>
          <Link to="https://www.phoenixclearinsight.com/" className="btn btn-secondary">Visit Our Website</Link>
        </div>
      </section>

      <section className="landing-container" aria-label="Phoenix assessment platform">
        <div className="landing-section-heading">
          <span>Assessment Platform</span>
          <h2>Built around the See It, Believe It, Achieve It journey.</h2>
          <p style={{ marginTop: 12, color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Start in under 10 minutes. Your results show your clarity across five dimensions—then we map the next aligned step.
          </p>
        </div>

        <div className="landing-card-grid">
          {platformCards.map((card) => (
            <article className="landing-card" key={card.title}>
              <div className="landing-card-topline">
                <span>{card.phase}</span>
                <strong>{card.badge}</strong>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <Link to={card.to} className="landing-card-link">{card.action} →</Link>
            </article>
          ))}
        </div>

        <div className="landing-callout">
          <div>
            <span>Client Stories</span>
            <h2>Share your transformation story.</h2>
            <p>Use the story form after a program or breakthrough moment so testimonials can be reviewed before publishing.</p>
          </div>
          <Link to="/assessment?share=story" className="btn btn-primary">Share Your Story</Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
