import { Suspense, lazy } from 'react'

// Lazy loaded sections
const Dashboard = lazy(() => import('../components/Dashboard/Dashboard'))

// Section loading placeholder
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner"></div>
    <span>Loading...</span>
  </div>
)

const DashboardPage = () => {
  return (
    <main className="main-content page-content">
      <Suspense fallback={<SectionLoader />}>
        <Dashboard />
      </Suspense>
    </main>
  )
}

export default DashboardPage
