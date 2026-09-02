import React, { createContext, useContext, useState, ReactNode } from 'react'

export type Frame = 'frame1' | 'frame2' | 'frame3' | 'frame4' | 'frame5' | 'frame6'
export type GameStatus = 'idle' | 'dragging' | 'validating' | 'success' | 'error' | 'complete'

export interface FeedbackState {
  type: 'success' | 'error' | 'info'
  message: string
}

export interface GameState {
  currentFrame: Frame
  currentStepIndex: number
  completedSteps: string[]
  draggedIngredient: string | null
  gameStatus: GameStatus
  feedback: FeedbackState | null
}

interface GameContextType {
  gameState: GameState
  setCurrentFrame: (frame: Frame) => void
  startDrag: (ingredient: string) => void
  endDrag: () => void
  completeStep: (stepId: string) => void
  resetGame: () => void
  setGameStatus: (status: GameStatus) => void
  setFeedback: (feedback: FeedbackState | null) => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialState: GameState = {
    currentFrame: 'frame1',
    currentStepIndex: 0,
    completedSteps: [],
    draggedIngredient: null,
    gameStatus: 'idle',
    feedback: null
  }

  const [gameState, setGameState] = useState<GameState>(initialState)

  const setCurrentFrame = (frame: Frame) => {
    setGameState(prev => ({
      ...prev,
      currentFrame: frame,
      draggedIngredient: null,
      feedback: null
    }))
  }

  const startDrag = (ingredient: string) => {
    setGameState(prev => ({
      ...prev,
      draggedIngredient: ingredient,
      gameStatus: 'dragging'
    }))
  }

  const endDrag = () => {
    setGameState(prev => ({
      ...prev,
      draggedIngredient: null,
      gameStatus: prev.gameStatus === 'dragging' ? 'idle' : prev.gameStatus
    }))
  }

  const completeStep = (stepId: string) => {
    setGameState(prev => {
      if (prev.completedSteps.includes(stepId)) return prev
      const newCompleted = [...prev.completedSteps, stepId]
      return {
        ...prev,
        completedSteps: newCompleted,
        currentStepIndex: newCompleted.length,
        gameStatus: 'success',
        draggedIngredient: null
      }
    })
  }

  const resetGame = () => {
    setGameState(initialState)
  }

  const setGameStatus = (status: GameStatus) => {
    setGameState(prev => ({ ...prev, gameStatus: status }))
  }

  const setFeedback = (feedback: FeedbackState | null) => {
    setGameState(prev => ({ ...prev, feedback }))
  }

  return (
    <GameContext.Provider
      value={{
        gameState,
        setCurrentFrame,
        startDrag,
        endDrag,
        completeStep,
        resetGame,
        setGameStatus,
        setFeedback
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within GameProvider')
  }
  return context
}
