'use client'

import React, { useState, useEffect } from 'react'

interface UploadZoneProps {
  isDragging: boolean
  isAnalyzing?: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
}

const LOADING_SYMBOLS = ['✱', '✲', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✢']

export function UploadZone({ 
  isDragging, 
  isAnalyzing = false,
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onClick 
}: UploadZoneProps) {
  const [symbolIndex, setSymbolIndex] = useState(0)

  useEffect(() => {
    if (!isAnalyzing) return
    const interval = setInterval(() => {
      setSymbolIndex((prev) => (prev + 1) % LOADING_SYMBOLS.length)
    }, 100)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  return (
    <div 
        className={`
            group relative w-full h-64 rounded-xl border border-dashed transition-all duration-300 ease-out flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden
            ${isDragging 
                ? 'border-foreground bg-neutral-50 dark:bg-neutral-900 scale-[1.01]' 
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50'
            }
            ${isAnalyzing ? 'pointer-events-none opacity-80' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
    >
        <div className="flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105">
            {/* Minimalist Upload Icon or Loading Symbol */}
            <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-2">
                {isAnalyzing ? (
                   <span className="text-foreground text-lg leading-none animate-pulse">
                     {LOADING_SYMBOLS[symbolIndex]}
                   </span>
                ) : (
                   <div className="w-2.5 h-2.5 bg-foreground mask-arrow" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                )}
            </div>
            
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                {isAnalyzing ? "Analyzing specimen..." : "Click to upload or drag and drop"}
            </p>
            {!isAnalyzing && (
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                    JPG, PNG up to 10MB
                </p>
            )}
        </div>
    </div>
  )
}
