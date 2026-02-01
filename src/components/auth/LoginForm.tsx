import React, { useState } from 'react';
import { AuthService } from '../../lib/firebase/auth';
import PasswordToggle from './PasswordToggle';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC < LoginFormProps > = ({ onSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await AuthService.loginWithEmail(email, password);
      
      if (rememberMe) {
        // Store email for next time (in secure way)
        localStorage.setItem('firechat_remembered_email', email);
      } else {
        localStorage.removeItem('firechat_remembered_email');
      }
      
      onSuccess();
    } catch (err: any) {
      // User-friendly error messages
      switch (err.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      await AuthService.loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };
  
  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }
    
    // This would be implemented in Phase 2
    alert(`Password reset email would be sent to: ${email}\n(Feature coming soon!)`);
  };
  
  // Check for remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem('firechat_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);
  
  return (
    <div className="auth-form">
      <h2>Welcome Back</h2>
      <p className="subtitle">Sign in to continue to FireChat</p>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <PasswordToggle
            password={password}
            setPassword={setPassword}
            disabled={loading}
            placeholder="Enter your password"
            id="password"
          />
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me</span>
          </label>
          
          <button
            type="button"
            className="forgot-password-btn"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="loading-spinner-small"></span>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="btn-google"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <span className="google-icon">G</span>
        Sign in with Google
      </button>

      <p className="switch-form">
        Don't have an account?{' '}
        <button type="button" className="text-button" onClick={onSwitchToSignup}>
          Sign up
        </button>
      </p>

      <div className="guest-note">
        <p>💡 <strong>Demo tip:</strong> Use test credentials:</p>
        <p className="demo-creds">Email: test@example.com | Password: Test123!</p>
        <p className="demo-warning">(Change these before production!)</p>
      </div>
    </div>
  );
};

export default LoginForm;