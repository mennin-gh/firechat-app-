import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase/config';
import AuthModal from './components/auth/AuthModal';
import MainChat from './components/layout/MainChat';
import './App.css';

function App() {
  const [user, setUser] = useState < User | null > (null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner-large"></div>
        <h2>FireChat Pro</h2>
        <p>Loading your chat experience...</p>
      </div>
    );
  }
  
  return (
    <div className="app">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />

      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1>🔥 FireChat Pro</h1>
            <p className="tagline">Real-time messaging perfected</p>
          </div>
          
          {user && (
            <div className="user-menu">
              <div className="user-greeting">
                <span>Hello, {user.displayName?.split(' ')[0] || 'User'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {user ? (
          <div className="chat-wrapper">
            <MainChat />
          </div>
        ) : (
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-icon">💬</div>
              <h2>Connect instantly with anyone</h2>
              <p className="hero-description">
                FireChat Pro brings people together with seamless real-time messaging, 
                voice calls, and file sharing—all wrapped in a beautiful interface.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="hero-cta"
              >
                Start Messaging Now
              </button>
              
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Real-time messaging</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Voice & video calls</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <span>End-to-end secure</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>FireChat Pro © 2024 • Built with React & Firebase</p>
      </footer>
    </div>
  );
}

export default App;