import { useState } from 'react';
import Login from './Components/Auth/Login';
import Register from './Components/Auth/Register';
import Chat from './Components/Chat/chat';
import { AuthProvider, useAuth } from './Context/authContext';
import { SocketProvider } from './Context/socketContext';
import { ThemeProvider } from './Context/themeContext';
import './css/Global.css';
function AuthWrapper() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return isLoginMode ? (
      <Login onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <Register onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return (
    <SocketProvider>
      <Chat />
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <div className="App">
        <AuthWrapper />
      </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
