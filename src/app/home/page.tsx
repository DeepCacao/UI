import Header from './components/header'
import ScanSection from './components/scan-section'
import RecentActivity from './components/recent-activity'

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-background flex flex-col overflow-hidden">
      <Header />
      
      {/* Dashboard Grid - Full height minus header */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-5rem)]">
        
        {/* Main Action Area (Scan) - Takes up most space */}
        <div className="md:col-span-8 lg:col-span-9 h-full border-r border-neutral-800/10">
          <ScanSection />
        </div>

        {/* Info Panel - Stacked Widgets */}
        <div className="md:col-span-4 lg:col-span-3 h-full flex flex-col bg-background">
          
          {/* Only Activity Feed now, filling the entire sidebar height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <RecentActivity />
          </div>
          
        </div>
      </div>
    </main>
  )
}
