'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

function useWebGLCheck() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
      setIsSupported(support)
    } catch (e) {
      setIsSupported(false)
    }
  }, [])

  return isSupported
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const isWebGLSupported = useWebGLCheck()

  if (isWebGLSupported === false) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900/50 rounded-lg border border-white/10 ${className}`}>
        <div className="text-center p-8">
          <p className="text-sm text-zinc-400 mb-2 uppercase tracking-widest">3D Experience Unavailable</p>
          <p className="text-xs text-zinc-500">WebGL is not supported in your browser or environment.</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      {isWebGLSupported && (
        <Spline
          scene={scene}
          className={className}
        />
      )}
    </Suspense>
  )
}
