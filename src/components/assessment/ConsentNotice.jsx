const ConsentNotice = ({ checked, onChange, id }) => (
  <div className="consent-notice-block">
    <div className="consent-notice-heading">Participation &amp; Data Use Notice</div>
    <div className="consent-notice-body">
      <p>
        <strong>What we collect:</strong> your name, email address, organization or agency affiliation (if applicable), segment, session details, and assessment responses.
      </p>
      <p>
        <strong>How it&apos;s used:</strong> your responses generate scores that Phoenix Clear Insight Consulting uses to support coaching conversations.
      </p>
      <p>
        <strong>Where it&apos;s stored:</strong> securely, and accessible only to Phoenix Clear Insight Consulting LLC.
      </p>
    </div>
    <label className="consent-inline-checkbox" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="consent-inline-checkmark" />
      <span>I have read and agree to the Participation &amp; Data Use Notice above.</span>
    </label>
  </div>
);

export default ConsentNotice;
