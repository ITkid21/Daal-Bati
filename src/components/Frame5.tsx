import React, { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import frame5Img from '../../frames/frame5.jfif'
import backgroundSong from '../../sounds/backgroundSong1.mp3'
import './Frame5.css'

const ROASTING_DIALOGUE =
  "Wah wah! Baati ki loi taiyaar ho gayi. Ab inhe ander se khokha karo aur chulhe ki anch par rakh do. Seedha aag pe pakne se Baati ander se kachchi nahin rehti — andar ki geeli teh bhi sookh jaati hai. Thoda sabr karo... Rajasthani dastarkhwan ki taiyari ho rahi hai!"

export const Frame5: React.FC = () => {
  const { setCurrentFrame } = useGame()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  // Typewriter effect
  useEffect(() => {
    let index = 0
    setDisplayedText('')
    setIsTypingComplete(false)

    const timer = setInterval(() => {
      if (index < ROASTING_DIALOGUE.length) {
        setDisplayedText(ROASTING_DIALOGUE.slice(0, index + 1))
        index++
      } else {
        setIsTypingComplete(true)
        clearInterval(timer)
      }
    }, 28)

    return () => clearInterval(timer)
  }, [])

  const handleSkipTyping = () => {
    if (!isTypingComplete) {
      setDisplayedText(ROASTING_DIALOGUE)
      setIsTypingComplete(true)
    }
  }

  const handleProceed = () => {
    setIsTransitioning(true)
    setTimeout(() => setCurrentFrame('frame6'), 450)
  }

  return (
    <div className={`frame-stage frame5-stage ${isTransitioning ? 'frame-fade-out' : ''}`}>
      {/* Background Music (continued atmosphere) */}
      <audio src={backgroundSong} autoPlay loop playsInline style={{ display: 'none' }} />

      {/* Background image – Baati on chulha / roasting scene */}
      <img
        src={frame5Img}
        alt="Baati Roasting on Chulha"
        className="frame5-bg-image"
      />

      {/* Rich overlay vignette */}
      <div className="frame5-vignette" />

      {/* Atmospheric fire glow from bottom */}
      <div className="frame5-fire-glow" />

      {/* Floating ember particles */}
      <div className="frame5-ember-container">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`ember ember-${i + 1}`} />
        ))}
      </div>

      {/* Dialogue Box – bottom overlay */}
      <div className="frame5-dialogue-wrapper" onClick={handleSkipTyping}>
        <div className="frame5-stage-label">
          <span className="stage-gem">❖</span>
          <span className="stage-label-text">BAATI ROASTING — THE SACRED FLAME</span>
          <span className="stage-gem">❖</span>
        </div>

        <div className="dialogue-box-component" id="frame5-dialogue-box">
          <div className="dialogue-scroll-card frame5-scroll">
            <p className="dialogue-text-content" id="frame5-dialogue-text">
              {displayedText}
              {!isTypingComplete && <span className="dialogue-cursor">|</span>}
            </p>
          </div>

          <button
            className={`dialogue-continue-btn frame5-continue-btn ${isTypingComplete ? 'continue-btn-pulse' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleProceed() }}
            id="frame5-continue-btn"
          >
            <span>SERVE THE FEAST</span>
            <span className="continue-chevron">»</span>
          </button>
        </div>
      </div>
    </div>
  )
}
