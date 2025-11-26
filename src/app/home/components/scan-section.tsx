'use client'

import { Scan, Upload, Camera, X, AlertTriangle } from 'lucide-react'
import { useState, useRef } from 'react'
import { Client } from "@gradio/client"

export default function ScanSection() {
  const [isHovered, setIsHovered] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    setError(null)
    setResult(null)
    setResultImage(null)

    try {
      // Connect to local Gradio server
      const client = await Client.connect("http://localhost:7860")
      
      const response = await client.predict("/predict", { 
        image: file 
      }) as any
      
      console.log("Prediction response:", response)
      
      // Response data structure: [image_result, json_result]
      if (response.data && response.data.length >= 2) {
          const imageResult = response.data[0]
          const jsonResult = response.data[1]

          // Handle Image
          if (imageResult && imageResult.url) {
              setResultImage(imageResult.url)
          }

          // Handle JSON
          if (jsonResult) {
              setResult(jsonResult)
          } else {
             throw new Error("Invalid response from model")
          }

      } else {
          throw new Error("Invalid response format from model")
      }

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to connect to AI model. Is the server running?")
    } finally {
      setAnalyzing(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const resetScan = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent onClick if any
    setResult(null)
    setResultImage(null)
    setError(null)
  }

  return (
    <section className="relative w-full h-full bg-neutral-900/5 dark:bg-neutral-900/20 overflow-hidden group cursor-pointer border-r border-neutral-800/10 flex flex-col items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Abstract Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Main Interactive Area */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg px-4">
        
        {/* Hidden Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
        />

        {analyzing ? (
             <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-neutral-200/20 border-t-foreground rounded-full animate-spin" />
                    <Camera className="w-8 h-8 animate-pulse text-foreground/50" />
                </div>
                <p className="text-sm uppercase tracking-widest animate-pulse">Analyzing Image...</p>
             </div>
        ) : result ? (
            <div className="w-full bg-background/80 backdrop-blur-md border border-neutral-800/20 p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-light uppercase tracking-widest">Analysis Result</h3>
                    <button onClick={resetScan} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {result.status === 'mock_mode' && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-600 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Mock Mode: Backend missing dependencies</span>
                    </div>
                )}
                
                {/* Check for backend errors returned in result */}
                {result.error && (
                     <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Error: {result.error}</span>
                    </div>
                )}

                {/* Display Annotated Image */}
                {resultImage && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                        <img src={resultImage} alt="Analyzed Cacao" className="w-full h-auto object-cover" />
                    </div>
                )}

                <div className="space-y-3">
                    {result.predictions && result.predictions.length > 0 ? (
                        result.predictions.map((pred: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                                <span className="font-medium text-lg">{pred.class}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${pred.confidence > 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {(pred.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No diseases detected</p>
                    )}
                </div>

                <button onClick={resetScan} className="w-full mt-6 py-3 bg-foreground text-background text-xs uppercase tracking-widest hover:bg-foreground/90 transition-all rounded">
                    Analyze Another
                </button>
            </div>
        ) : error ? (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-red-500">Analysis Failed</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="px-6 py-2 border border-neutral-200 text-sm hover:bg-neutral-50 transition-colors">
                    Try Again
                </button>
            </div>
        ) : (
            <>
                {/* Central Icon Container */}
                <div className={`relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center rounded-full border border-neutral-800/20 bg-background transition-all duration-500 ${isHovered ? 'scale-105 border-primary/50 shadow-2xl shadow-primary/5' : ''}`}>
                    
                    {/* Animated Rings */}
                    <div className={`absolute inset-0 rounded-full border border-dashed border-neutral-400/30 transition-all duration-[3s] ease-linear ${isHovered ? 'animate-[spin_10s_linear_infinite] opacity-100' : 'opacity-0'}`} />
                    <div className={`absolute inset-4 rounded-full border border-neutral-400/20 transition-all duration-500 ${isHovered ? 'scale-90' : 'scale-100'}`} />
                    
                    <Camera className={`w-16 h-16 md:w-20 md:h-20 text-foreground stroke-[1] transition-all duration-500 ${isHovered ? 'scale-110' : ''}`} />
                </div>

                {/* Text & Actions */}
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-light uppercase tracking-widest text-foreground">
                            Analyze Cacao
                        </h2>
                        <p className="text-sm text-muted-foreground font-light tracking-wide max-w-md mx-auto">
                            Detect Moniliophthora & Phytophthora using AI
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-4">
                        <button className="flex items-center gap-3 px-8 py-3 bg-foreground text-background text-xs uppercase tracking-widest hover:bg-foreground/90 transition-all">
                            <Scan className="w-4 h-4" />
                            <span>Take Photo</span>
                        </button>
                        <button 
                            onClick={handleUploadClick}
                            className="flex items-center gap-3 px-8 py-3 border border-neutral-800/20 bg-background text-foreground text-xs uppercase tracking-widest hover:border-neutral-800 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Upload Image</span>
                        </button>
                    </div>
                </div>
            </>
        )}

      </div>

      {/* Status Footer */}
      <div className="absolute bottom-8 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
        <div className={`w-2 h-2 rounded-full ${result ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
        AI Model v2.0 Ready
      </div>

    </section>
  )
}
