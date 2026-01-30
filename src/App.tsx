import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import './App.css'

// Import your config (you'll create this next)
import { firebaseConfig } from './lib/firebase/config'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

function App() {
  const [user, setUser] = useState < User | null > (null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])
  
  if (loading) {
    return <div className="loading">Loading FireChat...</div>
  }
  
  return (
    <div className="app">
      <header className="header">
        <h1>🔥 FireChat Pro</h1>
        <p>Real-time chat application</p>
      </header>
      <main className="main">
        {user ? (
          <div className="dashboard">
            <h2>Welcome, {user.displayName || user.email}!</h2>
            <p>You are now ready to start chatting.</p>
            <button onClick={() => auth.signOut()}>Sign Out</button>
          </div>
        ) : (
          <div className="auth-section">
            <h2>Get Started</h2>
            <p>Sign in to start messaging.</p>
            <button onClick={() => alert('Login modal will open here')}>
              Sign In
            </button>
          </div>
        )}
        <div className="status">
          <p>✅ Firebase is connected</p>
          <p>✅ React is running</p>
          <p>🚀 Build system: Active</p>
        </div>
      </main>
    </div>
  )
}

export default App