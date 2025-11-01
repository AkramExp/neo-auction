import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AuctionProvider } from './context/AuctionContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Dashboard from './components/Dashboard.jsx';
import HomePage from './components/HomePage.jsx';
import ConnectionStatus from './components/ConnectionStatus.jsx';
import BiddingHistory from './pages/BiddingHistory.jsx';

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <ConnectionStatus />
      <Routes>
        <Route path="/" element={!user ? <HomePage /> : <Dashboard />} />
        <Route path="/biddinghistory" element={<BiddingHistory />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <AuthProvider>
          <SocketProvider>
            <AuctionProvider>
              <AppContent />
            </AuctionProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;