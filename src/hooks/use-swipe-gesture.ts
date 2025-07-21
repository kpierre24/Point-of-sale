"use client"

import { useRef, useCallback } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number // Minimum distance for a swipe
  restraint?: number // Maximum perpendicular distance
  allowedTime?: number // Maximum time for swipe
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 100,
    restraint = 100,
    allowedTime = 300
  } = options

  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchStartTime = useRef<number>(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchStartTime.current = Date.now()
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    const touchEndX = touch.clientX
    const touchEndY = touch.clientY
    const touchEndTime = Date.now()

    const elapsedTime = touchEndTime - touchStartTime.current
    const distanceX = touchEndX - touchStartX.current
    const distanceY = touchEndY - touchStartY.current

    // Check if swipe was fast enough
    if (elapsedTime > allowedTime) return

    // Horizontal swipe
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
      if (distanceX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (distanceX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    // Vertical swipe
    else if (Math.abs(distanceY) >= threshold && Math.abs(distanceX) <= restraint) {
      if (distanceY > 0 && onSwipeDown) {
        onSwipeDown()
      } else if (distanceY < 0 && onSwipeUp) {
        onSwipeUp()
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint, allowedTime])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}