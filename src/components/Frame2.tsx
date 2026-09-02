import React, { useState, useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'
import frame2Video from '../../video frames/frame2.mp4'
import './Frame2.css'

const HALKU_DIALOGUE =
  "Arre bhai! Aaj ek special kaam hai. Humein banani hai asli Rajasthani Daal Baati. Pehle Daal taiyaar karenge, phir garma-garam Baati. Dhyaan se banana... khaane layak honi chahiye. Chal, shuru karte hain!"

export const Frame2: React.FC = () => {
  const { setCurrentFrame } = useGame()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-play video when component mounts
  useEffect(() => {
    const vid = videoRef.current
    if (vid) {
      vid.play().catch(() => {/* autoplay blocked – silently continue */})
    }
  }, [])

  // Typewriter effect
  useEffect(() => {
    let index = 0
    setDisplayedText('')
    setIsTypingComplete(false)

    const timer = setInterval(() => {
      if (index < HALKU_DIALOGUE.length) {
        setDisplayedText(HALKU_DIALOGUE.slice(0, index + 1))
        index++
      } else {
        setIsTypingComplete(true)
        clearInterval(timer)
      }
    }, 30)

    return () => clearInterval(timer)
  }, [])

  const handleSkipTyping = () => {
    if (!isTypingComplete) {
      setDisplayedText(HALKU_DIALOGUE)
      setIsTypingComplete(true)
    }
  }

  const handleProceed = () => {
    setIsTransitioning(true)
    setTimeout(() => setCurrentFrame('frame3'), 400)
  }

  return (
    <div className={`frame-stage frame2-stage ${isTransitioning ? 'frame-fade-out' : ''}`}>

      {/* ── Video Background ── */}
      <video
        ref={videoRef}
        src={frame2Video}
        className="frame2-video-bg"
        autoPlay
        playsInline
      />

      {/* Subtle atmospheric vignette */}
      <div className="frame2-light-overlay" />

      {/* ── Dialogue Box overlaid on video ── */}
      <div className="frame2-dialogue-wrapper" onClick={handleSkipTyping}>
        <div className="dialogue-box-component" id="story-dialogue-box">

          {/* Parchment scroll card */}
          <div className="dialogue-scroll-card">
            <p className="dialogue-text-content" id="dialogue-text">
              {displayedText}
              {!isTypingComplete && <span className="dialogue-cursor">|</span>}
            </p>
          </div>

          {/* Continue button */}
          <button
            className={`dialogue-continue-btn ${isTypingComplete ? 'continue-btn-pulse' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleProceed() }}
            id="story-continue-btn"
          >
            <span>NEXT</span>
            <span className="continue-chevron">»</span>
          </button>
        </div>
      </div>
    </div>
  )
}
