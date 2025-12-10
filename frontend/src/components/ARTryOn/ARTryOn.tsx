import { useNavigate } from 'react-router-dom'

const ARTryOn: React.FC = () => {
  const navigate = useNavigate()

  return (
    <section id="ar-tryon" style={{ 
      padding: '5rem 2rem', 
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
    }}>
      <div style={{ 
        maxWidth: '800px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
      }}>
        {/* AR Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#D4AF37" 
            strokeWidth="1.5"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>

        {/* Title */}
        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 600,
          color: '#FFFFFF',
          margin: 0,
        }}>
          Virtual <span style={{ color: '#D4AF37' }}>Try-On</span>
        </h2>

        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.125rem',
          lineHeight: 1.8,
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: '600px',
        }}>
          Experience our eyewear collection in augmented reality. 
          Use your camera to see how our glasses look on you in real-time 
          with advanced face tracking technology.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/collection')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 2.5rem',
            background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
            border: 'none',
            borderRadius: '9999px',
            color: '#1A1A1A',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)'
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.4)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span>Browse Collection</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          marginTop: '2rem',
        }}>
          {[
            { icon: '📷', title: 'Real-Time Preview', desc: 'See glasses on your face instantly' },
            { icon: '🎯', title: 'Face Tracking', desc: 'Advanced MindAR technology' },
            { icon: '📱', title: 'No App Required', desc: 'Works in your browser' },
          ].map((feature, idx) => (
            <div 
              key={idx}
              style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>
                {feature.icon}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '0.5rem',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ARTryOn
