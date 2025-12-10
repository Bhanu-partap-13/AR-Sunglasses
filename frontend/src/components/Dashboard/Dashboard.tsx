import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import './Dashboard.scss'

// Mock data for analytics
const customizationData = [
  { month: 'Jan', customizations: 450 },
  { month: 'Feb', customizations: 620 },
  { month: 'Mar', customizations: 580 },
  { month: 'Apr', customizations: 790 },
  { month: 'May', customizations: 950 },
  { month: 'Jun', customizations: 1240 }
]

const frameColorData = [
  { name: 'Matte Black', value: 320, color: 'rgba(26, 26, 26, 0.8)' },
  { name: 'Polished Gold', value: 280, color: 'rgba(212, 175, 55, 0.8)' },
  { name: 'Rose Gold', value: 190, color: 'rgba(183, 110, 121, 0.8)' },
  { name: 'Silver', value: 250, color: 'rgba(192, 192, 192, 0.8)' },
  { name: 'Tortoiseshell', value: 150, color: 'rgba(139, 69, 19, 0.8)' },
  { name: 'Champagne', value: 210, color: 'rgba(244, 207, 103, 0.8)' }
]

const lensSelectionData = [
  { name: 'Gradient Blue', value: 28, color: 'rgba(30, 58, 138, 0.8)' },
  { name: 'Brown', value: 18, color: 'rgba(146, 64, 14, 0.8)' },
  { name: 'Gray', value: 22, color: 'rgba(55, 65, 81, 0.8)' },
  { name: 'Green', value: 12, color: 'rgba(6, 95, 70, 0.8)' },
  { name: 'Mirror Gold', value: 10, color: 'rgba(212, 175, 55, 0.8)' },
  { name: 'Mirror Silver', value: 10, color: 'rgba(192, 192, 192, 0.8)' }
]

// Recent customizations carousel data
const recentCustomizations = [
  { id: 1, model: 'Aviator Elite', frame: 'Polished Gold', lens: 'Gradient Blue', time: '2 min ago' },
  { id: 2, model: 'Metropolitan', frame: 'Matte Black', lens: 'Gray', time: '5 min ago' },
  { id: 3, model: 'Heritage Round', frame: 'Tortoiseshell', lens: 'Brown', time: '8 min ago' },
  { id: 4, model: 'Sport Precision', frame: 'Silver', lens: 'Mirror Gold', time: '12 min ago' },
  { id: 5, model: 'Luxury Wayfarer', frame: 'Rose Gold', lens: 'Green', time: '15 min ago' },
]

const Dashboard: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState(0)
  const [metrics] = useState([
    { label: 'Total Customizations', value: '12,450', change: '+23%', trend: 'up' },
    { label: 'Avg. Session Time', value: '4:32', change: '+12%', trend: 'up' },
    { label: 'Conversion Rate', value: '34.2%', change: '+8%', trend: 'up' },
    { label: 'Frame Rate (FPS)', value: '60', change: 'Stable', trend: 'stable' },
  ])

  return (
    <section id="dashboard" className="dashboard-section">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <span className="section-label">Analytics</span>
          <h2 className="section-title">
            Real-Time <span className="accent">Dashboard</span>
          </h2>
          <p className="section-description">
            Comprehensive insights into customization trends and platform performance
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="metrics-grid">
          {metrics.map((metric, idx) => (
            <div 
              key={idx} 
              className={`metric-card ${activeMetric === idx ? 'active' : ''}`}
              onClick={() => setActiveMetric(idx)}
            >
              <div className="metric-icon">
                {metric.trend === 'up' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                )}
                {metric.trend === 'stable' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                )}
              </div>
              <div className="metric-content">
                <span className="metric-label">{metric.label}</span>
                <div className="metric-value-row">
                  <span className="metric-value">{metric.value}</span>
                  <span className={`metric-change ${metric.trend}`}>{metric.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Customization Trends */}
          <div className="chart-card large">
            <div className="chart-header">
              <h3 className="chart-title">Customization Trends</h3>
              <span className="chart-subtitle">Last 6 months</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={customizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888"
                    style={{ fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}
                  />
                  <YAxis 
                    stroke="#888888"
                    style={{ fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#D4AF37' }}
                    itemStyle={{ color: '#F5F5F0' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: '#F5F5F0',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '11px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="customizations" 
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    dot={{ fill: '#D4AF37', r: 4 }}
                    fill="rgba(212, 175, 55, 0.1)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frame Color Popularity */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Frame Color Popularity</h3>
              <span className="chart-subtitle">Current month</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={frameColorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888"
                    style={{ fontSize: '9px', fontFamily: 'Montserrat, sans-serif' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#888888"
                    style={{ fontSize: '10px', fontFamily: 'Montserrat, sans-serif' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#D4AF37' }}
                    itemStyle={{ color: '#F5F5F0' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {frameColorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lens Selection Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Lens Selection</h3>
              <span className="chart-subtitle">Distribution %</span>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={lensSelectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {lensSelectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 26, 26, 0.95)', 
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#F5F5F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Customizations Carousel */}
        <div className="recent-customizations">
          <h3 className="section-subtitle">Recent Customizations</h3>
          <div className="customizations-carousel">
            {recentCustomizations.map(custom => (
              <div key={custom.id} className="customization-card">
                <div className="card-header">
                  <div className="model-preview">
                    <svg viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="12" cy="10" rx="8" ry="6" stroke="#D4AF37" strokeWidth="1"/>
                      <ellipse cx="28" cy="10" rx="8" ry="6" stroke="#D4AF37" strokeWidth="1"/>
                      <path d="M20 10 Q20 8 20 10" stroke="#D4AF37" strokeWidth="1"/>
                    </svg>
                  </div>
                  <span className="time-badge">{custom.time}</span>
                </div>
                <div className="card-details">
                  <h4 className="model-name">{custom.model}</h4>
                  <div className="specs">
                    <span className="spec-item">
                      <span className="spec-label">Frame:</span> {custom.frame}
                    </span>
                    <span className="spec-item">
                      <span className="spec-label">Lens:</span> {custom.lens}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Heatmap (Simplified) */}
        <div className="geo-section">
          <h3 className="section-subtitle">Top Regions</h3>
          <div className="regions-list">
            <div className="region-item">
              <span className="region-name">North America</span>
              <div className="region-bar">
                <div className="bar-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="region-percentage">75%</span>
            </div>
            <div className="region-item">
              <span className="region-name">Europe</span>
              <div className="region-bar">
                <div className="bar-fill" style={{ width: '62%' }}></div>
              </div>
              <span className="region-percentage">62%</span>
            </div>
            <div className="region-item">
              <span className="region-name">Asia Pacific</span>
              <div className="region-bar">
                <div className="bar-fill" style={{ width: '48%' }}></div>
              </div>
              <span className="region-percentage">48%</span>
            </div>
            <div className="region-item">
              <span className="region-name">Middle East</span>
              <div className="region-bar">
                <div className="bar-fill" style={{ width: '35%' }}></div>
              </div>
              <span className="region-percentage">35%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
