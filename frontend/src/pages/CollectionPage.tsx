import { Suspense, lazy } from 'react'

// Lazy loaded sections
const Collections = lazy(() => import('../components/Collections/Collections'))

// Section loading placeholder
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner"></div>
    <span>Loading...</span>
  </div>
)

const CollectionPage = () => {
  return (
    <main className="main-content page-content">
      <Suspense fallback={<SectionLoader />}>
        <Collections />
      </Suspense>
    </main>
  )
}

export default CollectionPage
