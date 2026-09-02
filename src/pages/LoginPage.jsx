import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabaseClient';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { client, error: clientError } = getSupabaseClient();

    if (clientError || !client) {
      setError(clientError || 'Supabase is not configured correctly.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error: authError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')
          ? 'Unable to connect to Supabase auth service. Please check your VITE_SUPABASE_URL setting in .env.'
          : err?.message || 'Login failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-slide">
      <div className="hero">
        <div className="hero-label">Secured Access</div>
        <h1>Coach <em>Portal</em></h1>
        <p>Sign in to access the Phoenix Coach Console, review assessments, and manage client stories.</p>
      </div>

      <div className="container" style={{ maxWidth: '440px' }}>
        <div className="login-card hover-glow">
          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@example.com"
                autoComplete="email"
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password"
                autoComplete="current-password"
                required 
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary scale-on-hover"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={isSubmitting || !email || !password}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          <div className="login-card-footer">
            Secured Access for Authorized Users.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
