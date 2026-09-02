import React, { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import frame1Img from '../../frames/frame1.png'
import './Frame1.css'

export const Frame1: React.FC = () => {
  const { setCurrentFrame } = useGame()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showCard, setShowCard] = useState(false)

  // Give the opening scene time to establish before revealing the title card.
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCard(true)
    }, 4800)

    return () => clearTimeout(timer)
  }, [])

  const handleStartGame = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentFrame('frame2')
    }, 400)
  }

  return (
    <div className={`frame-stage frame1-stage ${isTransitioning ? 'frame-fade-out' : ''}`}>
      {/* Background Image */}
      <img 
        src={frame1Img} 
        alt="Rajasthani Kitchen Scene" 
        className="frame-bg-image"
      />

      {/* Atmospheric Warm Vignette Overlay */}
      <div className="frame-overlay-vignette"></div>

      {/* Central Start Game Card (Appears after the opening delay) */}
      <div className={`frame1-center-container ${showCard ? 'card-visible' : 'card-hidden'}`}>
        {showCard && (
          <div className="royal-card frame1-card">
            <div className="card-corner corner-tl"></div>
            <div className="card-corner corner-tr"></div>
            <div className="card-corner corner-bl"></div>
            <div className="card-corner corner-br"></div>

            <div className="royal-emblem">❖ ॐ ❖</div>

            <h1 className="frame1-main-title">DAAL BAATI</h1>
            <p className="frame1-subtitle">Traditional Rajasthani Royal Cooking</p>

            <div className="title-divider">
              <span className="divider-line"></span>
              <span className="divider-gem">♦</span>
              <span className="divider-line"></span>
            </div>

            <p className="frame1-lore">
              Step into the royal kitchen of Rajasthan. Prepare authentic slow-cooked Daal over a traditional clay Chulha with time-honored spices.
            </p>

            <button 
              className="btn-rajasthani start-game-btn" 
              onClick={handleStartGame}
              id="start-game-btn"
            >
              START GAME
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
