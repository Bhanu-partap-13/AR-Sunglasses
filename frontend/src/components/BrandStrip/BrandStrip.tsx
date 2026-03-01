import './BrandStrip.scss'

// SVG sunglasses icon used as a subtle separator between brand names
const SunglassesIcon = () => (
  <svg
    className="brand-strip__icon"
    viewBox="0 0 48 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Bridge */}
    <path d="M19 10 Q24 7 29 10" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    {/* Left lens */}
    <rect x="2" y="5" width="16" height="11" rx="5.5" stroke="#D4AF37" strokeWidth="1.6" fill="none" />
    {/* Right lens */}
    <rect x="30" y="5" width="16" height="11" rx="5.5" stroke="#D4AF37" strokeWidth="1.6" fill="none" />
    {/* Left arm */}
    <path d="M2 10 L0 11" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round" />
    {/* Right arm */}
    <path d="M46 10 L48 11" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const BRANDS = [
  { name: 'Ray-Ban',    style: 'italic' },
  { name: 'Oakley',     style: 'normal' },
  { name: 'Gucci',      style: 'italic' },
  { name: 'Prada',      style: 'normal' },
  { name: 'Versace',    style: 'italic' },
  { name: 'Tom Ford',   style: 'normal' },
  { name: 'Dior',       style: 'italic' },
  { name: 'Carrera',    style: 'normal' },
  { name: 'Persol',     style: 'italic' },
  { name: 'Maui Jim',   style: 'normal' },
  { name: 'Burberry',   style: 'italic' },
  { name: 'Chanel',     style: 'normal' },
]

const Track = () => (
  <div className="brand-strip__track" aria-hidden="true">
    {BRANDS.map((b, i) => (
      <span className="brand-strip__item" key={i}>
        <span
          className="brand-strip__name"
          style={{ fontStyle: b.style as 'italic' | 'normal' }}
        >
          {b.name}
        </span>
        <SunglassesIcon />
      </span>
    ))}
  </div>
)

const BrandStrip = () => {
  return (
    <div className="brand-strip" role="marquee" aria-label="Featured sunglasses brands">
      {/* Duplicate track for seamless infinite loop */}
      <Track />
      <Track />
    </div>
  )
}

export default BrandStrip
