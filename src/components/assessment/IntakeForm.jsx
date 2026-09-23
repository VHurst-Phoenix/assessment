import ConsentNotice from './ConsentNotice';

const IntakeForm = ({ type, formData, onChange, consentAgreed, onConsentChange, onSubmit }) => {
  const isReadiness = type === 'readiness';
  const fieldPrefix = `${type}-client`;
  const update = (field, value) => onChange({ ...formData, [field]: value });

  return (
    <div className="card intake-card animate-intake-card">
      <h3>{isReadiness ? 'Client Readiness' : 'Client Execution'}</h3>
      <p>A few client details and a short notice are required before Question 1.</p>
      <form onSubmit={onSubmit} className="unified-form unified-client-details">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor={`${fieldPrefix}-first-name`}>Client First Name *</label>
            <input id={`${fieldPrefix}-first-name`} type="text" required placeholder="Client first name" value={formData.firstName} onChange={(event) => update('firstName', event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor={`${fieldPrefix}-last-name`}>Client Last Name *</label>
            <input id={`${fieldPrefix}-last-name`} type="text" required placeholder="Client last name" value={formData.lastName} onChange={(event) => update('lastName', event.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor={`${fieldPrefix}-email`}>Client Email *</label>
          <input id={`${fieldPrefix}-email`} type="email" required placeholder="client@email.com" value={formData.email} onChange={(event) => update('email', event.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor={`${fieldPrefix}-company`}>Company / Agency Affiliation <span className="optional-label">(optional)</span></label>
            <input id={`${fieldPrefix}-company`} type="text" placeholder="Organization name" value={formData.company} onChange={(event) => update('company', event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor={`${fieldPrefix}-segment`}>Segment *</label>
            <select id={`${fieldPrefix}-segment`} required value={formData.segment} onChange={(event) => update('segment', event.target.value)}>
              <option value="">Select segment...</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
              <option value="Federal">Federal</option>
            </select>
          </div>
        </div>
        {isReadiness ? (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`${fieldPrefix}-session-type`}>Session Type</label>
              <select id={`${fieldPrefix}-session-type`} value={formData.sessionType} onChange={(event) => update('sessionType', event.target.value)}>
                <option value="clarity-intensive">Clarity Intensive</option>
                <option value="week1">Week 1</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor={`${fieldPrefix}-session-date`}>Session Date</label>
              <input id={`${fieldPrefix}-session-date`} type="date" value={formData.sessionDate} onChange={(event) => update('sessionDate', event.target.value)} />
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor={`${fieldPrefix}-checkpoint`}>Program Checkpoint *</label>
            <select id={`${fieldPrefix}-checkpoint`} required value={formData.programCheckpoint} onChange={(event) => update('programCheckpoint', event.target.value)}>
              <option value="">Select checkpoint...</option>
              <option value="Week 3">Week 3</option>
              <option value="Week 6">Week 6</option>
              <option value="Week 9">Week 9</option>
              <option value="Week 12">Week 12</option>
              <option value="Program Completion">Program Completion</option>
            </select>
          </div>
        )}
        <ConsentNotice id={`${fieldPrefix}-consent`} checked={consentAgreed} onChange={onConsentChange} />
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={!consentAgreed}>
          Begin Assessment →
        </button>
      </form>
    </div>
  );
};

export default IntakeForm;
