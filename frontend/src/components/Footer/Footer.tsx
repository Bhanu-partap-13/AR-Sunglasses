import { memo } from 'react'
import './Footer.scss'

const Footer: React.FC = memo(() => {
  return (
    <footer className="main-footer">
      {/* Top Section - Info Grid */}
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            {/* About Section */}
            <div className="footer-about">
              <h4 className="footer-heading">ABOUT NEXUS</h4>
              <p className="footer-text">
                Nexus Optics is a premium eyewear brand offering a wide range of designer sunglasses and frames. We blend cutting-edge technology with fashion and innovation.
              </p>
              <a href="mailto:PARTAPBHANU516@GMAIL.COM" className="footer-email">
                PARTAPBHANU516@GMAIL.COM ↗
              </a>
              <div className="footer-social-links">
                <a href="https://instagram.com/partap_bhanu__" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
                <a href="https://www.linkedin.com/in/bhanu-partap-a49084274/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
                <a href="https://www.youtube.com/@Brainicbhanu/shorts" target="_blank" rel="noopener noreferrer">YouTube ↗</a>
              </div>
            </div>

            {/* Services Section */}
            <div className="footer-column">
              <h4 className="footer-heading">SERVICES</h4>
              <ul className="footer-list">
                <li><a href="/customize">3D Try-On</a></li>
                <li><a href="/collection">Virtual Collection</a></li>
                <li><a href="/collection">Collections</a></li>
                <li><a href="/customize">Custom Design</a></li>
                <li><a href="/dashboard">Premium Dashboard</a></li>
                <li><a href="/collection">AR Experience</a></li>
              </ul>
            </div>

            {/* Address Section */}
            <div className="footer-column">
              <h4 className="footer-heading">ADDRESS</h4>
              <p className="footer-address">
                LOVELY PROFESSIONAL UNIVERSITY,<br />
                PHAGWARA, 144411,<br />
                PUNJAB, INDIA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Large Brand Name */}
      <div className="footer-bottom">
        <div className="footer-brand-large">
          <span className="brand-text">NEXUS</span>
        </div>
        {/* Running Man Illustration */}
        <div className="footer-illustration">
          <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <circle cx="50" cy="15" r="12" stroke="#e74c3c" strokeWidth="2" fill="none"/>
            {/* Body */}
            <path d="M50 27 L50 60" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Left arm */}
            <path d="M50 35 L30 55" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Right arm raised */}
            <path d="M50 35 L70 25" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Left leg */}
            <path d="M50 60 L35 95" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Right leg forward */}
            <path d="M50 60 L70 85" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Left foot */}
            <path d="M35 95 L25 100" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            {/* Right foot */}
            <path d="M70 85 L80 90" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer
