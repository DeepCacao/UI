"use client";

import { useState } from 'react'
import ScanSection from './components/scan-section'
import Nav from './components/nav'

export default function HomePage() {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.4)

  return (
    <main className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col">
      <Nav confidenceThreshold={confidenceThreshold} setConfidenceThreshold={setConfidenceThreshold} />
      <ScanSection confidenceThreshold={confidenceThreshold} />
    </main>
  )
}
