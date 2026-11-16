import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublishedStories } from '../api/dbClient';
import './HomeClientStories.css';

const MAX_HOME_STORIES = 3;

// Home page Client Stories section. The home page counts as part of the
// "Client Stories page" placement (decision 2026-11-16), so it shows the same
// stories: approved by an admin in the dashboard AND with "Client Stories
// page" ticked by the client (other placements may be ticked too). With no
// such story it falls back to the Share Your Story call to action, so the
// page never shows an empty section.
export default function HomeClientStories({ onStoriesLoaded }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    let isMounted = true;
    listPublishedStories('client_stories')
      .then((rows) => {
        if (!isMounted) return;
        const list = rows || [];
        setStories(list);
        onStoriesLoaded?.(list.length);
      })
      .catch((err) => console.warn('Client stories unavailable on the home page:', err));
    return () => { isMounted = false; };
  }, [onStoriesLoaded]);

  if (stories.length === 0) {
    return (
      <div className="landing-callout">
        <div>
          <span>Client Stories</span>
          <h2>Share your transformation story.</h2>
          <p>Use the story form after a program or breakthrough moment so testimonials can be reviewed before publishing.</p>
        </div>
        <Link to="/assessment/testimonial" className="btn btn-primary">Share Your Story</Link>
      </div>
    );
  }

  return (
    <section className="home-stories" aria-labelledby="home-stories-heading">
      <div className="home-stories-heading">
        <span>Client Stories</span>
        <h2 id="home-stories-heading">Real transitions, in clients’ own words.</h2>
      </div>

      <div className="home-stories-grid">
        {stories.slice(0, MAX_HOME_STORIES).map((story) => (
          <article className="home-story-card" key={story.id}>
            {story.band && <span className="home-story-band">{story.band}</span>}
            <blockquote>“{story.quote || story.after}”</blockquote>
            <div className="home-story-person">
              <strong>{story.displayName}</strong>
              {story.role && <small>{story.role}</small>}
            </div>
          </article>
        ))}
      </div>

      <div className="home-stories-actions">
        <Link to="/client-stories" className="btn btn-primary">Read all stories →</Link>
        <Link to="/assessment/testimonial" className="home-stories-share">Share your story</Link>
      </div>
    </section>
  );
}
