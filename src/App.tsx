import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase/config';
import AuthModal from './components/auth/AuthModal';
import LogoutConfirmation from './components/auth/LogoutConfirmation';
import MainChat from './components/layout/MainChat';
import { userService } from './lib/firebase/users';
import './App.css';

function App() {
  const [user, setUser] = useState < User | null > (null);
  const [userProfile, setUserProfile] = useState < any > (null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Load user profile from Firestore
          const profile = await userService.getUser(currentUser.uid);
          setUserProfile(profile);
          
          // Update user status to online
          await userService.updateUserStatus(currentUser.uid, 'online');
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleLogoutConfirm = async () => {
    try {
      if (user) {
        // Update status to offline before logout
        await userService.updateUserStatus(user.uid, 'offline');
      }
      await auth.signOut();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };
  
  const handleNewConversation = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // This will be implemented with a proper modal
    alert('New conversation modal coming soon!');
  };
  
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-spinner-large"></div>
          <h2>🔥 FireChat Pro</h2>
          <p>Loading your chat experience...</p>
          <div className="loading-steps">
            <span className="step active">✓ Firebase</span>
            <span className="step active">✓ Authentication</span>
            <span className="step">Loading chats...</span>
          </div>
        </div>
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
      
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        userName={userProfile?.displayName || user?.displayName || user?.email}
      />

      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1>🔥 FireChat Pro</h1>
            <p className="tagline">Real-time messaging perfected</p>
          </div>
          
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar-small">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName} />
                  ) : user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} />
                  ) : (
                    <span>{userProfile?.displayName?.charAt(0) || user.displayName?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {userProfile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className={`user-status ${userProfile?.status || 'offline'}`}>
                    ● {userProfile?.status === 'online' ? 'Online' : 
                       userProfile?.status === 'away' ? 'Away' : 'Offline'}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogoutClick}
                className="logout-btn"
                title="Sign out"
              >
                <span className="logout-icon">🚪</span>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                onClick={() => setShowAuthModal(true)}
                className="signin-btn"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {user ? (
          <div className="chat-wrapper">
            <MainChat 
              onNewConversation={handleNewConversation}
            />
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
              
              <div className="hero-actions">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hero-cta primary"
                >
                  Start Messaging Now
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hero-cta secondary"
                >
                  Try Demo
                </button>
              </div>
              
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <div className="feature-text">
                    <strong>Real-time messaging</strong>
                    <span>Instant delivery, no refresh needed</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <div className="feature-text">
                    <strong>Voice & video calls</strong>
                    <span>Crystal clear communication</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <div className="feature-text">
                    <strong>End-to-end secure</strong>
                    <span>Your conversations are private</span>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">📱</span>
                  <div className="feature-text">
                    <strong>Cross-platform</strong>
                    <span>Works on all devices</span>
                  </div>
                </div>
              </div>
              
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-number">0ms</span>
                  <span className="stat-label">Message delay</span>
                </div>
                <div className="stat">
                  <span className="stat-number">99.9%</span>
                  <span className="stat-label">Uptime</span>
                </div>
                <div className="stat">
                  <span className="stat-number">∞</span>
                  <span className="stat-label">Messages free</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>FireChat Pro © 2024 • Built with React & Firebase • v1.0.0</p>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <span className="divider">•</span>
            <a href="#" className="footer-link">Terms of Service</a>
            <span className="divider">•</span>
            <a href="#" className="footer-link">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;