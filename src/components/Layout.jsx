import './Layout.css';

const Layout = ({ children }) => {
  return (
    <>
      <header className="app-heading" aria-label="Phoenix Clear Insight">
        <div className="app-heading-brand">
          <span>Phoenix</span> Clear Insight
        </div>
        <div className="app-heading-tagline">See It · Believe It · Achieve It</div>
      </header>

      <main role="main">
        {children}
      </main>

      <footer className="site-footer">
        © 2026 <span>Phoenix Clear Insight Consulting LLC</span> · VetaBravo · See It. Believe It. Achieve It. · <span>phoenixclearinsight.com</span>
      </footer>
    </>
  );
};

export default Layout;
