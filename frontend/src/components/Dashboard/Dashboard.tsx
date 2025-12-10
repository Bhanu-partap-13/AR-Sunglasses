import { useEffect, useState } from 'react'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import './Dashboard.scss'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Chart options with luxury styling
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#F5F5F0',
        font: {
          family: 'Montserrat, sans-serif',
          size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      titleColor: '#D4AF37',
      bodyColor: '#F5F5F0',
      borderColor: '#D4AF37',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: '#888888',
        font: {
          family: 'Montserrat, sans-serif',
          size: 10
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.05)',
        drawBorder: false,
      },
      ticks: {
        color: '#888888',
        font: {
          family: 'Montserrat, sans-serif',
          size: 10
        }
      }
    }
  }
}

// Mock data for analytics
const customizationData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Customizations',
      data: [450, 620, 580, 790, 950, 1240],
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      fill: true,
      tension: 0.4,
    }
  ]
}

const frameColorData = {
  labels: ['Matte Black', 'Polished Gold', 'Rose Gold', 'Silver', 'Tortoiseshell', 'Champagne'],
  datasets: [
    {
      label: 'Popularity',
      data: [320, 280, 190, 250, 150, 210],
      backgroundColor: [
        'rgba(26, 26, 26, 0.8)',
        'rgba(212, 175, 55, 0.8)',
        'rgba(183, 110, 121, 0.8)',
        'rgba(192, 192, 192, 0.8)',
        'rgba(139, 69, 19, 0.8)',
        'rgba(244, 207, 103, 0.8)',
      ],
      borderColor: '#D4AF37',
      borderWidth: 1,
    }
  ]
}

const lensSelectionData = {
  labels: ['Gradient Blue', 'Brown', 'Gray', 'Green', 'Mirror Gold', 'Mirror Silver'],
  datasets: [
    {
      data: [28, 18, 22, 12, 10, 10],
      backgroundColor: [
        'rgba(30, 58, 138, 0.8)',
        'rgba(146, 64, 14, 0.8)',
        'rgba(55, 65, 81, 0.8)',
        'rgba(6, 95, 70, 0.8)',
        'rgba(212, 175, 55, 0.8)',
        'rgba(192, 192, 192, 0.8)',
      ],
      borderColor: '#D4AF37',
      borderWidth: 2,
    }
  ]
}

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
              <Line data={customizationData} options={chartOptions} />
            </div>
          </div>

          {/* Frame Color Popularity */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Frame Color Popularity</h3>
              <span className="chart-subtitle">Current month</span>
            </div>
            <div className="chart-body">
              <Bar data={frameColorData} options={{...chartOptions, scales: undefined}} />
            </div>
          </div>

          {/* Lens Selection Distribution */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Lens Selection</h3>
              <span className="chart-subtitle">Distribution %</span>
            </div>
            <div className="chart-body">
              <Doughnut 
                data={lensSelectionData} 
                options={{
                  ...chartOptions,
                  scales: undefined,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'right' as const,
                    }
                  }
                }} 
              />
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
