export default function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🦆 Duck Asset Service</h1>
      <p>Asset management system for Duck Engine</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/admin" style={{ 
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#0070f3',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none'
        }}>
          Go to Admin Panel
        </a>
      </div>
    </div>
  );
}
