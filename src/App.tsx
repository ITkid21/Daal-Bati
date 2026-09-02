import React from 'react'
import { useGame } from './context/GameContext'
import { Intro } from './components/Intro'
import { Frame1 } from './components/Frame1'
import { Frame2 } from './components/Frame2'
import { Frame3 } from './components/Frame3'
import { Frame4 } from './components/Frame4'
import rotatePhoneVideo from '../video frames/Rotate Phone.mp4'
import './styles/rajasthani-theme.css'

export const App: React.FC = () => {
  const { gameState } = useGame()

  const renderFrame = () => {
    switch (gameState.currentFrame) {
      case 'intro':
        return <Intro />
      case 'frame1':
        return <Frame1 />
      case 'frame2':
        return <Frame2 />
      case 'frame3':
        return <Frame3 />
      case 'frame4':
        return <Frame4 />
      default:
        return <Frame1 />
    }
  }

  return (
    <div className="app-container">
      <div className="orientation-prompt" role="status" aria-live="polite">
        <div className="orientation-prompt-card">
          <video
            className="orientation-video"
            src={rotatePhoneVideo}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={(event) => event.currentTarget.play().catch(() => {})}
            aria-label="Animation showing how to rotate your phone"
          />
          <h2>TURN YOUR DEVICE SIDEWAYS</h2>
          <p>Keep your device horizontal for the best cooking experience.</p>
        </div>
      </div>
      <div className="game-stage-wrapper">
        {renderFrame()}
      </div>
    </div>
  )
}
