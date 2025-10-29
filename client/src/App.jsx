import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AuctionProvider } from './context/AuctionContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import HomePage from './components/HomePage.jsx';
import ConnectionStatus from './components/ConnectionStatus.jsx';

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <ConnectionStatus />
      {!user ? <HomePage /> : <Dashboard />}
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider>
        <SocketProvider>
          <AuctionProvider>
            <AppContent />
          </AuctionProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}

export default App;