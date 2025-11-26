'use client'

// import { Client } from "@gradio/client"
import { useState, useRef, useEffect } from 'react'
import { UploadZone } from './upload-zone'

const LOADING_SYMBOLS = ['✱', '✲', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✢']

export default function ScanSection() {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [symbolIndex, setSymbolIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!analyzing) return
    const interval = setInterval(() => {
      setSymbolIndex((prev) => (prev + 1) % LOADING_SYMBOLS.length)
    }, 100)
    return () => clearInterval(interval)
  }, [analyzing])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = async (file: File) => {
    setAnalyzing(true)
    setError(null)
    setResult(null)
    setResultImage(null)

    try {
      // Local preview mode - bypassing backend connection
      const reader = new FileReader()
      
      reader.onload = (e) => {
        // Simulate processing delay for better UX
        setTimeout(() => {
          if (e.target?.result) {
            setResultImage(e.target.result as string)
            // Mock result to display the image without errors
            setResult({
              predictions: [] // This will trigger the "No specific pathology detected" state
            })
          }
          setAnalyzing(false)
        }, 1500)
      }
      
      reader.readAsDataURL(file)

    } catch (err: any) {
      console.error(err)
      setError("Failed to process image")
      setAnalyzing(false)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <section className="relative w-full h-full flex flex-col">
      
      {/* Main Interactive Area - Scrollable */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide">
          <div className="min-h-full flex flex-col items-center justify-center p-6 pb-32 md:pb-6 max-w-xl mx-auto space-y-8 animate-in fade-in duration-1000">
            
            {/* Header - Editorial Style */}
            <div className="text-center space-y-4 pt-10 md:pt-0">
            <h1 className="text-4xl md:text-5xl font-light italic tracking-tight text-foreground leading-tight">
                Cacao Disease Detection
            </h1>
            <p className="text-sm md:text-base text-neutral-500 max-w-md mx-auto leading-relaxed">
                Advanced computer vision for agricultural diagnostics. Upload a sample to identify potential pathogens.
            </p>
            </div>

            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Image Display - Minimalist */}
            {resultImage && !analyzing && (
                <div className="w-full rounded-xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in fade-in zoom-in duration-500">
                    <img 
                        src={resultImage} 
                        alt="Analyzed Cacao" 
                        className="w-full h-auto object-cover max-h-[500px]" 
                    />
                </div>
            )}

            {/* Upload Controls */}
            <div className="w-full hidden md:block">
                <UploadZone 
                    isDragging={isDragging}
                    isAnalyzing={analyzing}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                />
            </div>

             {/* Footer Info */}
            {!result && !analyzing && !error && (
                <div className="text-center">
                    <p className="text-[10px] text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">
                        Powered by Cacao-Diseases Model v1.0
                    </p>
                </div>
            )}
          </div>
      </div>

      {/* Mobile Fixed Bottom Button */}
      <div className="md:hidden absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background to-transparent z-50">
            <button 
                onClick={handleUploadClick}
                disabled={analyzing}
                className="w-full py-4 bg-foreground text-background text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed"
            >
                <div className="flex items-center justify-center w-5 h-5">
                    {analyzing ? (
                        <span className="text-lg leading-none animate-pulse">
                            {LOADING_SYMBOLS[symbolIndex]}
                        </span>
                    ) : (
                        <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
                    )}
                </div>
                <span>{analyzing ? "Analyzing..." : "Upload Image"}</span>
            </button>
      </div>

    </section>
  )
}
