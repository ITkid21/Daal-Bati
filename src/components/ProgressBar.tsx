import React from 'react'
import './ProgressBar.css'

interface ProgressBarProps {
  label?: string
  currentStep: number
  totalSteps: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label = 'PREPARATION',
  currentStep,
  totalSteps
}) => {
  const percentage = totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0

  return (
    <div className="rajasthani-top-bar" id="game-progress-bar">
      <div className="top-bar-ornament left-ornament">❖</div>
      
      <div className="progress-content">
        <span className="progress-title">{label}</span>
        
        <div className="progress-track-wrapper">
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${percentage}%` }}
            >
              <div className="progress-shimmer"></div>
            </div>
          </div>
        </div>

        <span className="progress-fraction">
          {currentStep} / {totalSteps}
        </span>
      </div>

      <div className="top-bar-ornament right-ornament">❖</div>
    </div>
  )
}
