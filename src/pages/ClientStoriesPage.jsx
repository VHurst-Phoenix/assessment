import { useState, useEffect } from 'react';
import { listPublishedStories } from '../api/dbClient';
import './ClientStoriesPage.css';

const ClientStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        // Only approved, consented stories cleared for this page, with only
        // the public fields (name per the client's choice, role, story, Band).
        const approved = await listPublishedStories('client_stories');
        setStories(approved);
        setError(null);
      } catch (err) {
        console.error('Failed to load testimonials from Supabase:', err);
        setError(err.message || 'Failed to load client stories. Please try again later.');
      }
    };
    loadStories();
  }, []);

  return (
    <div className="animate-fade-slide">
      {/* Hero Header */}
      <div className="hero">
        <div className="hero-label">Client Journeys</div>
        <h1>The <em>Transformation</em></h1>
        <p>Real stories of transitions, strategic shifts, and breakthroughs from professionals who worked with Phoenix.</p>
      </div>

      <div className="container stories-container">

      {error && (
        <div className="card error-message" style={{ background: '#FAECEE', borderLeft: '4px solid #8B2635', color: '#8B2635' }} role="alert">
          <strong>Unable to load stories:</strong> {error}
        </div>
      )}

      <div className="stories-list">
        {stories.length === 0 ? (
          <div className="card empty-stories hover-glow">
            <p>No stories available yet.</p>
            <span className="empty-sub">Approved client stories will be showcased here.</span>
          </div>
        ) : (
          stories.map(story => (
            <div key={story.id} className="card story-card hover-lift">
              <div className="story-header">
                <div className="story-profile">
                  <div className="story-avatar">✦</div>
                  <div>
                    <h3>{story.displayName}</h3>
                    {story.role && <p className="story-role">{story.role}</p>}
                  </div>
                </div>
                {story.band && (
                  <span className="story-badge">
                    {story.band}
                  </span>
                )}
              </div>

              {story.quote && <blockquote className="story-quote">“{story.quote}”</blockquote>}

              <div className="story-timeline">
                <div className="timeline-block before">
                  <span className="timeline-label">Before</span>
                  <p>{story.before}</p>
                </div>

                <div className="timeline-block shift">
                  <span className="timeline-label">The Shift</span>
                  <p>{story.shift}</p>
                </div>

                <div className="timeline-block after">
                  <span className="timeline-label">After</span>
                  <p>{story.after}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default ClientStoriesPage;
