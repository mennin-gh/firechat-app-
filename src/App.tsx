import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase/config';
import AuthModal from './components/auth/AuthModal';
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
    return <div className="loading">Loading FireChat...</div>;
  }
  
  return (
    <div className="app">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />

      <header className="header">
        <h1>🔥 FireChat Pro</h1>
        <p>Real-time chat application</p>
      </header>

      <main className="main">
        {user ? (
          <div className="dashboard">
            <div className="user-info">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="user-avatar"
                />
              )}
              <div>
                <h2>Welcome, {user.displayName || user.email}!</h2>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            <p className="dashboard-text">You are now ready to start chatting.</p>
            <div className="dashboard-actions">
              <button onClick={() => alert('Chat interface coming next!')}>
                Open Chat
              </button>
              <button onClick={handleLogout} className="btn-logout">
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-section">
            <h2>Connect & Converse</h2>
            <p>Sign in to start real-time messaging with anyone, anywhere.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn-auth-primary"
            >
              Get Started
            </button>
          </div>
        )}

        <div className="status">
          <p>✅ Firebase is connected</p>
          <p>✅ React is running</p>
          <p>✅ Auth System Ready</p>
          <p>🚀 Next: Chat Interface</p>
        </div>
      </main>
    </div>
  );
}

export default App;