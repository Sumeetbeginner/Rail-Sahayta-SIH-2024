import React, { useState, useEffect } from 'react';

const AdminView = () => {
  const [userUrls, setUserUrls] = useState([]);
  const socket = new WebSocket('ws://localhost:8080');

  useEffect(() => {
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'admin' }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        setUserUrls(data.userUrls);
      }
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #0c2340)',
        padding: '14px 24px',
        borderBottom: '3px solid #f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>🚂 Rail Sahayta <span style={{ color: '#f59e0b' }}>| Emergency Admin Panel</span></h1>
        <span style={{ background: '#22c55e', padding: '3px 10px', borderRadius: 3, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>ACTIVE</span>
      </div>

      <div style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>
          <i className="fas fa-video" style={{ marginRight: 8, color: '#f59e0b' }}></i>
          Incoming Emergency Calls ({userUrls.length})
        </h2>

        {userUrls.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 48, color: '#64748b',
            border: '1px dashed #334155', borderRadius: 12, marginTop: 20
          }}>
            <i className="fas fa-phone-alt" style={{ fontSize: 32, marginBottom: 12, display: 'block' }}></i>
            No emergency calls at the moment
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {userUrls.map((user, index) => (
            <a
              key={index}
              href={user.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#1e293b', borderRadius: 10, padding: '16px 20px',
                textDecoration: 'none', color: '#fff',
                border: '1px solid #334155', transition: 'all .2s'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.5s infinite'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: 16 }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Emergency Call #{index + 1}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Click to join video call</div>
              </div>
              <i className="fas fa-arrow-right" style={{ marginLeft: 'auto', color: '#f59e0b' }}></i>
            </a>
          ))}
        </div>
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

export default AdminView;
