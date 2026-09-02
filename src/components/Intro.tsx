import React, { useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import introductionVideo from '../../video frames/IntroductionTOgame.mp4'
import './Intro.css'

export const Intro: React.FC = () => {
  const { setCurrentFrame } = useGame()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    const video = videoRef.current
    if (!video) return

    setIsPlaying(true)
    video.play().catch(() => setIsPlaying(false))
  }

  const handleVideoEnded = () => {
    setCurrentFrame('frame1')
  }

  return (
    <div className="frame-stage intro-stage">
      <video
        ref={videoRef}
        className="intro-video"
        src={introductionVideo}
        playsInline
        preload="auto"
        onEnded={handleVideoEnded}
        aria-label="Introduction to the Daal Baati game"
      />

      {!isPlaying && (
        <button
          className="intro-play-button"
          onClick={handlePlay}
          aria-label="Play introduction video"
          id="intro-play-button"
        >
          <span className="intro-play-icon" aria-hidden="true">▶</span>
          <span>PLAY</span>
        </button>
      )}
    </div>
  )
}