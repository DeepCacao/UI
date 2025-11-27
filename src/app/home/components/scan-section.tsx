'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadZone } from './upload-zone'
import { TextShimmer } from '@/components/ui/text-shimmer'
import { CacaoModel } from '@/lib/onnx-model'

const LOADING_SYMBOLS = ['✱', '✲', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✢']

interface ScanSectionProps {
  confidenceThreshold: number
}

export default function ScanSection({ confidenceThreshold }: ScanSectionProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [symbolIndex, setSymbolIndex] = useState(0)
  const [modelLoading, setModelLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<CacaoModel | null>(null)

  useEffect(() => {
    // Inicializar modelo
    const initModel = async () => {
      try {
        setModelLoading(true)
        const model = new CacaoModel()
        await model.load()
        modelRef.current = model
        console.log("Modelo inicializado correctamente")
      } catch (e) {
        console.error("Error inicializando modelo:", e)
        setError("Error cargando el modelo de IA. Por favor recarga la página.")
      } finally {
        setModelLoading(false)
      }
    }

    initModel()
  }, [])

  useEffect(() => {
    if (!analyzing && !modelLoading) return
    const interval = setInterval(() => {
      setSymbolIndex((prev) => (prev + 1) % LOADING_SYMBOLS.length)
    }, 100)
    return () => clearInterval(interval)
  }, [analyzing, modelLoading])

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
    if (!modelRef.current) {
      setError("El modelo aún se está cargando, intenta de nuevo en unos segundos")
      return
    }

    setAnalyzing(true)
    setError(null)
    setResult(null)
    setResultImage(null)

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        if (e.target?.result) {
          const imgSrc = e.target.result as string
          setResultImage(imgSrc)

          // Crear elemento imagen para procesar
          const img = new Image()
          img.src = imgSrc
          img.onload = async () => {
            try {
              // Realizar inferencia
              const predictions = await modelRef.current!.predict(img)
              console.log("Predicciones:", predictions)

              setResult({
                predictions: predictions.map(p => ({
                  label: p.class,
                  score: p.confidence,
                  box: p.bbox
                }))
              })
            } catch (err) {
              console.error("Error en inferencia:", err)
              setError("Error al analizar la imagen")
            } finally {
              setAnalyzing(false)
            }
          }
        }
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
    <section className="relative w-full flex-1 min-h-0 flex flex-col">

      {/* Main Interactive Area - Scrollable */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-hide">
        <div className="min-h-full flex flex-col items-center justify-center p-6 pb-6 max-w-xl mx-auto space-y-8 animate-in fade-in duration-1000">

          {/* Header - Editorial Style */}
          <div className="text-center space-y-4 pt-10 md:pt-0">
            <TextShimmer as="h1" className="text-4xl md:text-5xl font-medium tracking-tight leading-tight" duration={4} repeatDelay={4}>
              Hi, how are you?
            </TextShimmer>
            {/* Model Status Indicator - Replaced with minimal loader below */}
            {modelLoading && (
              <div className="flex justify-center pt-2 animate-in fade-in duration-300">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
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
          {resultImage && (
            <div className="w-full rounded-xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in fade-in zoom-in duration-500 relative">
              <img
                src={resultImage}
                alt="Analyzed Cacao"
                className="w-full h-auto object-cover max-h-[500px]"
              />

              {/* Bounding Boxes Overlay */}
              {!analyzing && result?.predictions && result.predictions
                .filter((p: any) => p.score >= confidenceThreshold)
                .map((pred: any, i: number) => {
                  // Las coordenadas vienen NORMALIZADAS (0-1) desde el modelo
                  // Simplemente multiplicamos por 100 para obtener porcentajes CSS
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${pred.box[0] * 100}%`,
                        top: `${pred.box[1] * 100}%`,
                        width: `${pred.box[2] * 100}%`,
                        height: `${pred.box[3] * 100}%`,
                        border: '2px solid #ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        pointerEvents: 'none'
                      }}
                    >
                      <span className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {pred.label} {Math.round(pred.score * 100)}%
                      </span>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Results Text */}
          {!analyzing && result && (
            <div className="w-full space-y-2 animate-in slide-in-from-bottom-4 duration-500">
              {result.predictions.filter((p: any) => p.score >= confidenceThreshold).length > 0 ? (
                result.predictions
                  .filter((p: any) => p.score >= confidenceThreshold)
                  .map((pred: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{pred.label}</span>
                      <span className="text-sm text-neutral-500">Confidence: {(pred.score * 100).toFixed(1)}%</span>
                    </div>
                  ))
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-center border border-green-100 dark:border-green-900/50">
                  No pathology detected (above threshold).
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm w-full text-center animate-in fade-in">
              {error}
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

          {/* Footer Info & Controls */}
          {!analyzing && !error && (
            <div className="text-center space-y-4">
              {result && (
                <div className="max-w-xs mx-auto">
                  {/* Slider moved to NavOverlay */}
                </div>
              )}

              <TextShimmer as="p" className="text-[10px] uppercase tracking-widest" duration={3} spread={1}>
                {modelLoading ? "" : ""}
              </TextShimmer>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Button */}
      <div className="md:hidden w-full p-6 bg-background z-50 shrink-0">
        <div className="w-full p-[2px] rounded-full bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 shadow-lg transition-all active:scale-[0.98]">
          <button
            onClick={handleUploadClick}
            disabled={analyzing || modelLoading}
            className="w-full py-4 rounded-full bg-neutral-900 text-white text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-5 h-5">
              {analyzing || modelLoading ? (
                <span className="text-lg leading-none">
                  {LOADING_SYMBOLS[symbolIndex]}
                </span>
              ) : (
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </div>
            <span>
              Upload Image
            </span>
          </button>
        </div>
      </div>

    </section>
  )
}
