import React, { useState, useEffect } from 'react'
import { useGame } from '../context/GameContext'
import frame6Img from '../../frames/frame6.jfif'
import backgroundSong from '../../sounds/backgroundSong1.mp3'
import { DAAL_PREPARATION_RECIPE, BAATI_PREPARATION_RECIPE } from '../data/recipe'
import './Frame6.css'

const CELEBRATION_LINES = [
  { emoji: '🎉', text: 'SHAHBAASH!' },
  { emoji: '🍲', text: 'Royal Daal Baati Ready!' },
  { emoji: '👑', text: 'Ek dum asli Rajasthani Dastarkhwan!' },
]

export const Frame6: React.FC = () => {
  const { resetGame, setCurrentFrame } = useGame()
  const [visibleLines, setVisibleLines] = useState(0)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    CELEBRATION_LINES.forEach((_, i) => {
      setTimeout(() => setVisibleLines(i + 1), 400 + i * 500)
    })
    setTimeout(() => setShowActions(true), 400 + CELEBRATION_LINES.length * 500 + 300)
  }, [])

  const handleRestart = () => {
    resetGame()
    setCurrentFrame('frame1')
  }

  return (
    <div className="frame-stage frame6-stage">
      {/* Celebration music */}
      <audio src={backgroundSong} autoPlay loop playsInline style={{ display: 'none' }} />

      {/* Full-scene background */}
      <img
        src={frame6Img}
        alt="Royal Daal Baati Feast"
        className="frame6-bg-image"
      />

      {/* Warm gold radial overlay */}
      <div className="frame6-gold-overlay" />

      {/* Confetti / particle sparkle bursts */}
      <div className="frame6-confetti-layer" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className={`confetti-piece cp-${i + 1}`} />
        ))}
      </div>

      {/* Center celebration card */}
      <div className="frame6-center-card royal-card" id="celebration-card">
        <div className="card-corner corner-tl" />
        <div className="card-corner corner-tr" />
        <div className="card-corner corner-bl" />
        <div className="card-corner corner-br" />

        {/* Animated top emblem */}
        <div className="frame6-royal-emblem">
          <span className="emblem-star">✦</span>
          <span className="emblem-text">राजस्थानी दावत</span>
          <span className="emblem-star">✦</span>
        </div>

        {/* Title lines revealed one-by-one */}
        <div className="frame6-title-lines">
          {CELEBRATION_LINES.map((line, i) => (
            <div
              key={i}
              className={`celebration-line celebration-line-${i} ${i < visibleLines ? 'line-visible' : 'line-hidden'}`}
            >
              <span className="cel-emoji">{line.emoji}</span>
              <span className="cel-text">{line.text}</span>
            </div>
          ))}
        </div>

        <div className="title-divider">
          <span className="divider-line" />
          <span className="divider-gem">♦</span>
          <span className="divider-line" />
        </div>

        {/* Ingredients summary */}
        <div className="frame6-ingredients-summary">
          <p className="summary-heading">All Ingredients Mastered</p>
          <div className="summary-grid">
            <div className="summary-col">
              <p className="summary-col-label">🥣 Daal</p>
              {DAAL_PREPARATION_RECIPE.map(s => (
                <span key={s.id} className="summary-badge daal-badge">
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
            <div className="summary-col">
              <p className="summary-col-label">🧆 Baati</p>
              {BAATI_PREPARATION_RECIPE.map(s => (
                <span key={s.id} className="summary-badge baati-badge">
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Final score / achievement */}
        <div className="frame6-achievement">
          <span className="achievement-star">⭐</span>
          <span className="achievement-star">⭐</span>
          <span className="achievement-star">⭐</span>
          <p className="achievement-label">Master Chef — Royal Kitchen of Rajasthan</p>
          <span className="achievement-star">⭐</span>
          <span className="achievement-star">⭐</span>
          <span className="achievement-star">⭐</span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className={`frame6-actions`}>
            <button
              className="btn-rajasthani frame6-replay-btn"
              onClick={handleRestart}
              id="frame6-play-again-btn"
            >
              ↺ COOK AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
