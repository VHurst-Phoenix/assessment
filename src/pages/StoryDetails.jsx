import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabaseClient';
import { updateTestimonialStatus, deleteTestimonial } from '../api/dbClient';
import './StoryDetails.css';

const StoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      setError('');
      try {
        const { client } = getSupabaseClient();
        const { data, error } = await client
          .from(process.env.REACT_APP_SUPABASE_TESTIMONIALS_TABLE)
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setStory(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load story.');
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  const handleAction = async (newStatus) => {
    if (!story) return;
    setIsProcessing(true);
    setActionError('');
    try {
      await updateTestimonialStatus(story.id, newStatus);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setActionError(err.message || `Failed to ${newStatus.toLowerCase()} story.`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="story-details-loading">
        <p>Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="story-details-error">
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="story-details-card">
      <h2>Story Details</h2>
      <div className="story-field">
        <strong>Client:</strong> {story.firstName} {story.lastName}
      </div>
      <div className="story-field">
        <strong>Stage:</strong> {story.stage}
      </div>
      <div className="story-field">
        <strong>Before:</strong>
        <p>{story.before}</p>
      </div>
      <div className="story-field">
        <strong>Shift:</strong>
        <p>{story.shift}</p>
      </div>
      <div className="story-field">
        <strong>After:</strong>
        <p>{story.after}</p>
      </div>
      {actionError && <div className="story-action-error">{actionError}</div>}
      {story && (
        <>
          <button
            className="btn btn-primary"
            disabled={isProcessing}
            onClick={() => handleAction('Approved')}
          >
            Approve
          </button>
          <button
            className="btn btn-danger"
            disabled={isProcessing}
            onClick={() => handleAction('Rejected')}
          >
            Reject
          </button>
          <button
            className="btn btn-warning"
            disabled={isProcessing}
            onClick={async () => {
              try {
                setError('');
                await deleteTestimonial(story.id);
                navigate('/dashboard');
              } catch (err) {
                console.error(err);
                setActionError(err.message || 'Failed to delete story.');
              }
            }}
          >
            Delete
          </button>
          <button
            className="btn btn-secondary"
            disabled={isProcessing}
            onClick={() => navigate('/dashboard')}
          >
            Back
          </button>
        </>
      )}
      </div>
    </div>
  );
};

export default StoryDetails;
