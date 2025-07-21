"use client"

import * as React from "react"
import { useCallback, useRef, useState } from "react"

export interface MicroInteractionOptions {
  scale?: number
  duration?: number
  easing?: string
  shadow?: boolean
  glow?: boolean
}

export function useMicroInteractions(options: MicroInteractionOptions = {}) {
  const {
    scale = 1.02,
    duration = 200,
    easing = "ease-in-out",
    shadow = true,
    glow = false
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    if (elementRef.current) {
      elementRef.current.style.transform = `scale(${scale})`
      elementRef.current.style.transition = `all ${duration}ms ${easing}`
      
      if (shadow) {
        elementRef.current.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
      }
      
      if (glow) {
        elementRef.current.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)'
      }
    }
  }, [scale, duration, easing, shadow, glow])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1)'
      elementRef.current.style.boxShadow = ''
    }
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsPressed(true)
    if (elementRef.current) {
      elementRef.current.style.transform = `scale(${scale * 0.96})`
    }
  }, [scale])

  const handleMouseUp = useCallback(() => {
    setIsPressed(false)
    if (elementRef.current && isHovered) {
      elementRef.current.style.transform = `scale(${scale})`
    } else if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1)'
    }
  }, [scale, isHovered])

  const interactionProps = {
    ref: elementRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    style: {
      transition: `all ${duration}ms ${easing}`,
      transformOrigin: 'center',
      cursor: 'pointer',
    }
  }

  return {
    interactionProps,
    isHovered,
    isPressed,
    elementRef
  }
}

// Hook for staggered animations
export function useStaggeredAnimation(itemCount: number, delay: number = 100) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())

  const triggerStaggeredAnimation = useCallback(() => {
    setVisibleItems(new Set()) // Reset
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]))
      }, i * delay)
    }
  }, [itemCount, delay])

  const isItemVisible = useCallback((index: number) => {
    return visibleItems.has(index)
  }, [visibleItems])

  return {
    triggerStaggeredAnimation,
    isItemVisible,
    visibleItems
  }
}

// Hook for loading state transitions
export function useLoadingTransition(isLoading: boolean, delay: number = 300) {
  const [showLoading, setShowLoading] = useState(false)
  const [showContent, setShowContent] = useState(!isLoading)

  React.useEffect(() => {
    if (isLoading) {
      setShowContent(false)
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
      const timer = setTimeout(() => {
        setShowContent(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [isLoading, delay])

  return {
    showLoading,
    showContent
  }
}

// Hook for focus management with micro-interactions
export function useFocusInteractions() {
  const [isFocused, setIsFocused] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1.01)'
      elementRef.current.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
    }
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (elementRef.current) {
      elementRef.current.style.transform = 'scale(1)'
      elementRef.current.style.boxShadow = ''
    }
  }, [])

  const focusProps = {
    ref: elementRef,
    onFocus: handleFocus,
    onBlur: handleBlur,
    style: {
      transition: 'all 200ms ease-in-out',
      transformOrigin: 'center',
    }
  }

  return {
    focusProps,
    isFocused,
    elementRef
  }
}