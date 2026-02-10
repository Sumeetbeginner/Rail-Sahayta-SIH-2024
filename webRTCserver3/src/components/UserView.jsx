import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserView = () => {
  const navigate = useNavigate();
  const socket = new WebSocket('ws://localhost:8080');

  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 8);
    const userUrl = `http://localhost:8081/#${uniqueId}`;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'user', url: userUrl }));
    };

    setTimeout(() => {
      window.location.href = userUrl;
    }, 2000);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #0c2340)',
        position: 'fixed', top: 0, width: '100%',
        padding: '14px 24px', borderBottom: '3px solid #f59e0b',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>🚂 Rail Sahayta <span style={{ color: '#f59e0b' }}>| Emergency Support</span></h1>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="loader" style={{ marginBottom: 24 }}></div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connecting to Emergency Support</h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Please wait while we set up your secure video call...</p>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
          <i className="fas fa-shield-alt" style={{ color: '#22c55e', marginRight: 6 }}></i>
          End-to-end encrypted connection
        </p>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, width: '100%',
        background: '#1e293b', padding: '8px 24px',
        textAlign: 'center', fontSize: 11, color: '#64748b',
        borderTop: '1px solid #334155'
      }}>
        Ministry of Railways, Government of India | Rail Sahayta Emergency Support System
      </div>
    </div>
  );
};

export default UserView;
