import { Link } from 'react-router-dom';
import './FormDirectory.css';

const FormDirectory = () => {
  const forms = [
    {
      title: "Clarity Assessment",
      desc: "A 25-question evaluation measuring client clarity across 5 dimensions.",
      badge: "Free / Client",
      badgeClass: "badge-free",
      link: "/assessment",
      icon: "✦"
    },
    {
      title: "Share Your Story",
      desc: "Submit your transformation journey, key shifts, and breakthroughs.",
      badge: "Client Testimonial",
      badgeClass: "badge-client",
      link: "/assessment?share=story",
      icon: "✉"
    },
    {
      title: "Client Readiness",
      desc: "Evaluate prospective clients' emotional readiness and bandwidth for coaching.",
      badge: "Coach Only",
      badgeClass: "badge-coach",
      link: "/assessment?mode=coach&assessment=readiness",
      icon: "🔑"
    },
    {
      title: "Client Execution",
      desc: "Assess action consistency, homework completion, and milestone progress.",
      badge: "Coach Only",
      badgeClass: "badge-coach",
      link: "/assessment?mode=coach&assessment=execution",
      icon: "📈"
    }
  ];

  return (
    <section className="form-directory-section" aria-label="Phoenix Forms Directory">
      <div className="directory-divider"></div>
      <div className="directory-header">
        <h2>Assessment & Evaluation <em>Hub</em></h2>
        <p>Access all client clarity questionnaires, coach review forms, and testimonial submittals.</p>
      </div>
      <div className="directory-grid">
        {forms.map((form, idx) => (
          <Link key={idx} to={form.link} className="directory-card hover-lift hover-glow">
            <div className="card-top">
              <span className="card-icon">{form.icon}</span>
              <span className={`card-badge ${form.badgeClass}`}>{form.badge}</span>
            </div>
            <h3>{form.title}</h3>
            <p>{form.desc}</p>
            <span className="card-action-link">Open Form →</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FormDirectory;
