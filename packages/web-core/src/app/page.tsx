export default function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🦆 Duck Engine Web Core</h1>
      <p>Web core for Duck Engine: assets, scenes, and tooling</p>
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
