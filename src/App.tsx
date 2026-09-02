import React from 'react'
import { useGame } from './context/GameContext'
import { Frame1 } from './components/Frame1'
import { Frame2 } from './components/Frame2'
import { Frame3 } from './components/Frame3'
import { Frame4 } from './components/Frame4'
import './styles/rajasthani-theme.css'

export const App: React.FC = () => {
  const { gameState } = useGame()

  const renderFrame = () => {
    switch (gameState.currentFrame) {
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
      <div className="game-stage-wrapper">
        {renderFrame()}
      </div>
    </div>
  )
}
