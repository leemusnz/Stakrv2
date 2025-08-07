"use client"

import DevTestingPanel from '@/components/dev-testing-panel'
import AvatarTestPanel from '@/components/avatar-test-panel'
import PerformanceDashboard from '@/components/admin/performance-dashboard'

export default function DevToolsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Developer Tools</h1>
        <p className="text-muted-foreground">Testing and debugging utilities for Stakr development</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <DevTestingPanel />
          <AvatarTestPanel />
        </div>
        <div className="space-y-6">
          <PerformanceDashboard />
        </div>
      </div>
    </div>
  )
}
