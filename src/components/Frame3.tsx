import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { DAAL_PREPARATION_RECIPE, INGREDIENT_COLORS, RecipeStep } from '../data/recipe'
import { ProgressBar } from './ProgressBar'
import gameBgVideo from '../../video frames/gamebackgroundframe3.mp4'
import transitionVideo from '../../video frames/frame3to4Transiction.mp4'
import spoiledVideo from '../../video frames/daalspoiled.mp4'
import backgroundSong from '../../sounds/backgroundSong1.mp3'
import './Frame3.css'

interface DraggingState {
  ingredientId: string
  currentX: number
  currentY: number
  offsetX: number
  offsetY: number
  startX: number
  startY: number
  isSnapping: boolean
  hasError: boolean
}

type TransitionState = 'interactive' | 'completing' | 'video_playing' | 'fading_to_next' | 'spoiled_video_playing'
type WaterMiniGamePhase = 'inactive' | 'active' | 'success' | 'failed'

// Water mini-game constants
const WATER_TARGET_MIN = 58   // 58% level
const WATER_TARGET_MAX = 65   // 65% level
const WATER_MAX = 100
const WATER_FILL_RATE = 18    // units per second while pouring

export const Frame3: React.FC = () => {
  const { gameState, startDrag, endDrag, completeStep, setGameStatus, setCurrentFrame, resetGame } = useGame()

  const [dragState, setDragState] = useState<DraggingState | null>(null)
  const [isPotHovered, setIsPotHovered] = useState(false)
  const [potSplash, setPotSplash] = useState<string | null>(null)
  const [shakingIngredient, setShakingIngredient] = useState<string | null>(null)
  const [guidanceMessage, setGuidanceMessage] = useState<string>('')
  const [transitionState, setTransitionState] = useState<TransitionState>('interactive')

  // ── Water Mini-Game State ──────────────────────────────────────────────────
  const [waterPhase, setWaterPhase] = useState<WaterMiniGamePhase>('inactive')
  const [waterLevel, setWaterLevel] = useState(0)
  // Dragging the water lota (pitcher)
  const [lotaDragState, setLotaDragState] = useState<{x: number; y: number; offsetX: number; offsetY: number} | null>(null)
  const [isOverPourZone, setIsOverPourZone] = useState(false)
  const [isPouringActive, setIsPouringActive] = useState(false) // pointer held over pour zone
  const [waterResultMsg, setWaterResultMsg] = useState('')
  const [showWaterBanner, setShowWaterBanner] = useState(false)

  // Background music state
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundMenuRef = useRef<HTMLDivElement | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const potRef = useRef<HTMLDivElement>(null)
  const lotaRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)
  const lotaPointerIdRef = useRef<number | null>(null)
  const transitionVideoRef = useRef<HTMLVideoElement>(null)
  const hasTransitionedRef = useRef(false)

  // RAF refs for smooth water fill
  const fillRafRef = useRef<number | null>(null)
  const lastFillTimeRef = useRef<number>(0)
  const isPouringRef = useRef(false)
  const waterLevelRef = useRef(0)

  const completedSet = new Set(gameState.completedSteps)
  const currentStep: RecipeStep | undefined = DAAL_PREPARATION_RECIPE[gameState.completedSteps.length]
  const allIngredientsAdded = gameState.completedSteps.length >= DAAL_PREPARATION_RECIPE.length
  const isComplete = allIngredientsAdded && waterPhase === 'success'
  // Only disable gameplay during active water game, failure state, or when fully complete/transitioning
  // waterPhase 'success' should NOT disable so remaining ingredients can be dragged
  const isGameplayDisabled = transitionState !== 'interactive' || isComplete || waterPhase === 'active' || waterPhase === 'failed'

  // ── Audio Setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
      audio.muted = isMuted
      audio.play().catch(() => {})
    }
    return () => { if (audio) audio.pause() }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
        setIsSoundMenuOpen(false)
      }
    }
    if (isSoundMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isSoundMenuOpen])

  const handleToggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !isMuted
      audioRef.current.muted = nextMuted
      setIsMuted(nextMuted)
      if (!nextMuted && audioRef.current.paused) audioRef.current.play().catch(() => {})
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    if (audioRef.current) {
      audioRef.current.volume = newVol
      if (newVol > 0 && isMuted) { audioRef.current.muted = false; setIsMuted(false) }
      else if (newVol === 0 && !isMuted) { audioRef.current.muted = true; setIsMuted(true) }
    }
  }

  // ── Guidance ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (waterPhase === 'active') {
      if (waterLevel < WATER_TARGET_MIN) {
        setGuidanceMessage('Keep pouring water into the Daal pot...')
      } else if (waterLevel <= WATER_TARGET_MAX) {
        setGuidanceMessage('Perfect level! Release now for best Daal!')
      } else {
        setGuidanceMessage('Too much! Game Over!')
      }
    } else if (waterPhase === 'success') {
      if (allIngredientsAdded) {
        setGuidanceMessage('Royal Daal Preparation Complete! Simmering on sacred Chulha...')
      } else if (currentStep) {
        setGuidanceMessage(`Step ${currentStep.order}: Drag & Drop ${currentStep.label} (${currentStep.hindiLabel}) into the pot`)
      }
    } else if (waterPhase === 'inactive') {
      if (currentStep) {
        setGuidanceMessage(`Step ${currentStep.order}: Drag & Drop ${currentStep.label} (${currentStep.hindiLabel}) into the pot`)
      }
    }
  }, [waterPhase, waterLevel, allIngredientsAdded, currentStep])

  // ── Activate water mini-game after water ingredient ───────────────────
  const waterIngredientAdded = completedSet.has('water')
  useEffect(() => {
    if (waterIngredientAdded && waterPhase === 'inactive' && transitionState === 'interactive') {
      // Short delay for polish
      setTimeout(() => setWaterPhase('active'), 500)
    }
  }, [waterIngredientAdded, waterPhase, transitionState])

  // ── Trigger boiling video when ALL ingredients and water game are done ──
  useEffect(() => {
    if (allIngredientsAdded && waterPhase === 'success' && transitionState === 'interactive') {
      setTransitionState('completing')
      if (audioRef.current) audioRef.current.pause()
      setTimeout(() => setTransitionState('video_playing'), 600)
    }
  }, [allIngredientsAdded, waterPhase, transitionState])

  // ── RAF Water Fill Loop ───────────────────────────────────────────────────
  const startFillLoop = useCallback(() => {
    if (fillRafRef.current !== null) return
    lastFillTimeRef.current = performance.now()

    const loop = (now: number) => {
      const dt = (now - lastFillTimeRef.current) / 1000
      lastFillTimeRef.current = now

      setWaterLevel(prev => {
        let next = prev
        if (isPouringRef.current) {
          next = Math.min(WATER_MAX, prev + WATER_FILL_RATE * dt)
        }
        waterLevelRef.current = next
        return next
      })

      fillRafRef.current = requestAnimationFrame(loop)
    }
    fillRafRef.current = requestAnimationFrame(loop)
  }, [])

  const stopFillLoop = useCallback(() => {
    if (fillRafRef.current !== null) {
      cancelAnimationFrame(fillRafRef.current)
      fillRafRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isPouringActive) {
      isPouringRef.current = isPouringActive
      startFillLoop()
    } else {
      isPouringRef.current = false
      stopFillLoop()
    }
    return () => stopFillLoop()
  }, [isPouringActive, startFillLoop, stopFillLoop])

  // ── Check pour zone overlap ───────────────────────────────────────────────
  const checkPourZoneCollision = useCallback((clientX: number, clientY: number): boolean => {
    if (!potRef.current) return false
    const rect = potRef.current.getBoundingClientRect()
    const hitBuffer = 30
    return clientX >= rect.left - hitBuffer && clientX <= rect.right + hitBuffer &&
           clientY >= rect.top - hitBuffer && clientY <= rect.bottom + hitBuffer
  }, [])

  // ── Lota (water container) drag handlers ─────────────────────────────────
  const handleLotaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (waterPhase !== 'active' || waterPhase === 'success' as WaterMiniGamePhase) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    lotaPointerIdRef.current = e.pointerId
    const rect = e.currentTarget.getBoundingClientRect()
    setLotaDragState({
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    })
  }

  const handleLotaPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lotaDragState) return
    const over = checkPourZoneCollision(e.clientX, e.clientY)
    setIsOverPourZone(over)
    setIsPouringActive(over)
    setLotaDragState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
  }

  const handleLotaPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!lotaDragState) return
    try {
      if (lotaPointerIdRef.current !== null && e.currentTarget.hasPointerCapture(lotaPointerIdRef.current)) {
        e.currentTarget.releasePointerCapture(lotaPointerIdRef.current)
      }
    } catch { /* safe */ }
    lotaPointerIdRef.current = null

    setIsPouringActive(false)
    setIsOverPourZone(false)
    setLotaDragState(null)

    // Evaluate water level when lota is released
    const level = waterLevelRef.current
    if (level >= WATER_TARGET_MIN && level <= WATER_TARGET_MAX) {
      // SUCCESS
      setWaterResultMsg('Perfect! Just right!')
      setWaterPhase('success')
      stopFillLoop()
      // Show the success banner briefly, then auto-hide so the pot is usable
      setShowWaterBanner(true)
      setTimeout(() => setShowWaterBanner(false), 1800)
    } else {
      // FAILED
      setWaterResultMsg(level > WATER_TARGET_MAX ? 'Too much water! Daal Spoiled.' : 'Not enough water! Daal Spoiled.')
      setWaterPhase('failed')
      stopFillLoop()
      if (audioRef.current) audioRef.current.pause()
      
      setTimeout(() => {
        setTransitionState('spoiled_video_playing')
      }, 800)
    }
  }, [lotaDragState, stopFillLoop])

  // ── Transition video handlers ─────────────────────────────────────────────
  const handleTransitionVideoEnded = useCallback(() => {
    if (hasTransitionedRef.current) return
    hasTransitionedRef.current = true
    setTransitionState('fading_to_next')
    setTimeout(() => setCurrentFrame('frame4'), 400)
  }, [setCurrentFrame])

  const handleSpoiledVideoEnded = useCallback(() => {
    resetGame()
    setCurrentFrame('frame1')
  }, [resetGame, setCurrentFrame])

  const handleTransitionVideoError = useCallback(() => {
    if (hasTransitionedRef.current) return
    hasTransitionedRef.current = true
    setCurrentFrame('frame4')
  }, [setCurrentFrame])

  useEffect(() => {
    if (transitionState === 'video_playing' && transitionVideoRef.current) {
      const vid = transitionVideoRef.current
      vid.currentTime = 0
      const playPromise = vid.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true
          vid.play().catch(() => handleTransitionVideoError())
        })
      }
    }
  }, [transitionState, handleTransitionVideoError])

  // ── Ingredient drag handlers ──────────────────────────────────────────────
  const checkPotCollision = useCallback((clientX: number, clientY: number): boolean => {
    if (!potRef.current) return false
    const rect = potRef.current.getBoundingClientRect()
    const hitBuffer = 30
    return clientX >= rect.left - hitBuffer && clientX <= rect.right + hitBuffer &&
           clientY >= rect.top - hitBuffer && clientY <= rect.bottom + hitBuffer
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, step: RecipeStep) => {
    if (audioRef.current && audioRef.current.paused && !isMuted) audioRef.current.play().catch(() => {})
    if (completedSet.has(step.ingredient) || dragState !== null || isGameplayDisabled || allIngredientsAdded) return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    const targetEl = e.currentTarget
    const rect = targetEl.getBoundingClientRect()
    targetEl.setPointerCapture(e.pointerId)
    pointerIdRef.current = e.pointerId

    setDragState({
      ingredientId: step.ingredient,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: rect.left,
      startY: rect.top,
      isSnapping: false,
      hasError: false
    })
    startDrag(step.ingredient)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.isSnapping || isGameplayDisabled) return
    const isOverPot = checkPotCollision(e.clientX, e.clientY)
    if (isOverPot !== isPotHovered) setIsPotHovered(isOverPot)
    setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.isSnapping) return

    const targetEl = e.currentTarget
    try {
      if (pointerIdRef.current !== null && targetEl.hasPointerCapture(pointerIdRef.current)) {
        targetEl.releasePointerCapture(pointerIdRef.current)
      }
    } catch { /* safe */ }
    pointerIdRef.current = null

    const isOverPot = checkPotCollision(e.clientX, e.clientY)
    const ingredientId = dragState.ingredientId

    if (isOverPot) {
      if (currentStep && currentStep.ingredient === ingredientId) {
        completeStep(ingredientId)
        setIsPotHovered(false)
        setPotSplash(ingredientId)
        setTimeout(() => setPotSplash(null), 800)
        setDragState(null)
        endDrag()
        // Water mini-game activates via useEffect watching allIngredientsAdded
      } else {
        setIsPotHovered(false)
        setGameStatus('error')
        setGuidanceMessage(`abee ruk! pahale ${currentStep?.label} tho daal`)
        setDragState(prev => prev ? { ...prev, isSnapping: true, hasError: true } : null)
        setShakingIngredient(ingredientId)
        setTimeout(() => { setShakingIngredient(null); setDragState(null); endDrag() }, 380)
      }
    } else {
      setIsPotHovered(false)
      setDragState(prev => prev ? { ...prev, isSnapping: true } : null)
      setTimeout(() => { setDragState(null); endDrag() }, 250)
    }
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => handlePointerUp(e)

  // ── Pot broth visuals ────────────────────────────────────────────────────
  const getPotBrothStyle = () => {
    if (completedSet.size === 0) return { opacity: 0 }
    let baseColor = '#C89D3C'
    if (completedSet.has('tomato')) baseColor = '#D46332'
    if (completedSet.has('green-chilli')) baseColor = '#C2842B'
    return {
      opacity: 1,
      background: `radial-gradient(ellipse at 50% 50%, #FFF3B0 0%, ${baseColor} 65%, #5C320A 100%)`
    }
  }

  // Water level color
  const getWaterFillColor = () => {
    if (waterLevel < WATER_TARGET_MIN) return 'linear-gradient(to top, #3A8FD4, #5DADE2)'
    if (waterLevel <= WATER_TARGET_MAX) return 'linear-gradient(to top, #1B8A3C, #27AE60)'
    return 'linear-gradient(to top, #D44332, #E74C3C)'
  }

  // Lota position while dragging
  const lotaStyle: React.CSSProperties = lotaDragState
    ? {
        position: 'fixed',
        left: lotaDragState.x - lotaDragState.offsetX,
        top: lotaDragState.y - lotaDragState.offsetY,
        zIndex: 800,
        pointerEvents: 'none',
        transform: isOverPourZone ? 'rotate(-45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        transition: 'transform 0.2s ease',
        cursor: 'grabbing'
      }
    : {
        position: 'absolute',
        right: '8%',
        top: '55%',
        zIndex: 50,
        cursor: 'grab'
      }

  return (
    <div
      className={`frame-stage frame3-stage ${transitionState === 'completing' ? 'frame3-fading-out' : ''}`}
      ref={stageRef}
    >
      {/* Background Audio */}
      <audio ref={audioRef} src={backgroundSong} loop playsInline />

      {/* Top Fixed Progress Bar */}
      <ProgressBar
        label="DAAL PREPARATION"
        currentStep={isComplete ? DAAL_PREPARATION_RECIPE.length + 1 : gameState.completedSteps.length}
        totalSteps={DAAL_PREPARATION_RECIPE.length + 1}
      />

      {/* Sound Settings */}
      <div className="top-right-audio-menu-wrapper" ref={soundMenuRef}>
        <button
          className={`audio-hamburger-btn ${isSoundMenuOpen ? 'menu-btn-active' : ''}`}
          onClick={() => setIsSoundMenuOpen(prev => !prev)}
          title="Sound & Music Settings"
          id="audio-menu-hamburger-btn"
          aria-label="Sound Settings Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        {isSoundMenuOpen && (
          <div className="audio-dropdown-panel" id="audio-settings-dropdown">
            <div className="audio-panel-header">
              <span className="audio-panel-gem">❖</span>
              <span className="audio-panel-title">MUSIC SETTINGS</span>
              <span className="audio-panel-gem">❖</span>
            </div>
            <div className="audio-control-row">
              <button
                className={`audio-mute-toggle-btn ${isMuted ? 'muted' : 'active'}`}
                onClick={handleToggleMute}
                id="audio-panel-mute-btn"
              >
                <span className="mute-icon">{isMuted ? '🔇' : '🎵'}</span>
                <span className="mute-text">{isMuted ? 'MUTED' : 'PLAYING'}</span>
              </button>
            </div>
            <div className="audio-volume-row">
              <span className="vol-label">Volume</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="audio-panel-slider"
                id="audio-panel-volume-slider"
              />
              <span className="vol-percent">{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Scene */}
      <div
        className="frame3-canvas-area"
        onPointerMove={handlePointerMove}
      >
        <video
          src={gameBgVideo}
          className="frame-bg-image frame3-bg"
          autoPlay loop muted playsInline
        />

        {/* Steam */}
        <div className="chulha-steam-container">
          <div className="steam-particle steam-1"></div>
          <div className="steam-particle steam-2"></div>
          <div className="steam-particle steam-3"></div>
        </div>

        {/* Pot Drop Target */}
        <div
          ref={potRef}
          className={`pot-drop-target ${isPotHovered ? 'pot-target-hovered' : ''} ${potSplash ? 'pot-simmering' : ''}`}
          id="daal-pot-target"
        >
          <div className="pot-aura-ring"></div>
          <div className="pot-interior-broth" style={getPotBrothStyle()}>
            {completedSet.has('dal') && <div className="broth-lentil-specks"></div>}
            {completedSet.has('green-chilli') && <div className="broth-chilli-specks"></div>}
            {completedSet.has('tomato') && <div className="broth-tomato-specks"></div>}
          </div>
          {potSplash && (
            <div className="pot-splash-burst">
              <span className="splash-sparkle">✨</span>
              <span className="splash-bubble">🫧</span>
            </div>
          )}
        </div>

        {/* Ingredient Labels */}
        {DAAL_PREPARATION_RECIPE.map((step) => {
          const isCompleted = completedSet.has(step.ingredient)
          const isCurrent = currentStep?.ingredient === step.ingredient && !allIngredientsAdded
          const isBeingDragged = dragState?.ingredientId === step.ingredient
          const isShaking = shakingIngredient === step.ingredient

          return (
            <div
              key={step.id}
              className={`ingredient-hotspot ${isCompleted ? 'ingredient-used' : ''} ${isCurrent ? 'ingredient-next-up' : ''} ${isShaking ? 'ingredient-error-shake' : ''}`}
              style={{
                left: step.position.left,
                top: step.position.top,
                opacity: isBeingDragged ? 0.25 : 1,
                pointerEvents: isGameplayDisabled || allIngredientsAdded ? 'none' : 'auto'
              }}
              onPointerDown={(e) => handlePointerDown(e, step)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              id={`ingredient-${step.ingredient}`}
              title={`Drag ${step.label} (${step.hindiLabel}) to pot`}
            >
              <div className="ingredient-pill-tag" style={{ borderColor: step.color }}>
                <span className="tag-icon">{step.icon}</span>
                <span className="tag-text">{step.label}</span>
                {isCompleted && <span className="tag-check">✓</span>}
              </div>
            </div>
          )
        })}

        {/* Drag Avatar */}
        {dragState && (
          <div
            className={`drag-floating-avatar ${dragState.isSnapping ? 'avatar-snapping' : ''} ${dragState.hasError ? 'avatar-error' : ''}`}
            style={{
              left: dragState.isSnapping ? `${dragState.startX}px` : `${dragState.currentX - dragState.offsetX}px`,
              top: dragState.isSnapping ? `${dragState.startY}px` : `${dragState.currentY - dragState.offsetY}px`,
              background: INGREDIENT_COLORS[dragState.ingredientId] || '#D4AF37'
            }}
          >
            <div className="avatar-content">
              <span className="avatar-icon">
                {DAAL_PREPARATION_RECIPE.find(s => s.ingredient === dragState.ingredientId)?.icon || '🍲'}
              </span>
              <span className="avatar-label">
                {DAAL_PREPARATION_RECIPE.find(s => s.ingredient === dragState.ingredientId)?.label}
              </span>
            </div>
          </div>
        )}

        {/* Guidance Bar */}
        <div className="recipe-guidance-bar">
          <div className="guidance-ornament">❖</div>
          <p className="guidance-text">{guidanceMessage}</p>
          <div className="guidance-ornament">❖</div>
        </div>

        {/* ══ WATER QUANTITY MINI-GAME OVERLAY ══ */}
        {(waterPhase === 'active' || waterPhase === 'failed') && transitionState === 'interactive' && (
          <div className="water-minigame-overlay" id="water-minigame-overlay">
            {/* Left panel: Water Level Meter */}
            <div className="water-meter-panel">
              <div className="water-meter-title">जल स्तर<br /><span>Water Level</span></div>
              <div className="water-level-meter" id="water-level-meter">
                {/* MAX label */}
                <div className="water-label water-label-max">MAX</div>
                {/* Target zone highlight */}
                <div
                  className="water-target-zone"
                  style={{
                    bottom: `${WATER_TARGET_MIN}%`,
                    height: `${WATER_TARGET_MAX - WATER_TARGET_MIN}%`
                  }}
                >
                  <span className="target-zone-text">TARGET</span>
                </div>
                {/* Fill */}
                <div
                  className="water-meter-fill"
                  style={{
                    height: `${waterLevel}%`,
                    background: getWaterFillColor()
                  }}
                />
                {/* MIN label */}
                <div className="water-label water-label-min">MIN</div>
                {/* Tick marks */}
                <div className="water-tick-mark" style={{ bottom: `${WATER_TARGET_MIN}%` }} />
                <div className="water-tick-mark" style={{ bottom: `${WATER_TARGET_MAX}%` }} />
              </div>
              <div className="water-level-percent">{Math.round(waterLevel)}%</div>
            </div>

            {/* Center: Instructions */}
            <div className="water-instructions-panel">
              <div className="water-instr-icon">🏺</div>
              <p className="water-instr-text">
                Drag the <strong>water lota</strong> over the pot<br />
                and <strong>hold</strong> to pour water.<br />
                Release when in the <span className="target-highlight">green zone</span>.
              </p>
              {waterResultMsg && (
                <div className={`water-result-msg ${waterLevel > WATER_TARGET_MAX ? 'msg-error' : waterLevel >= WATER_TARGET_MIN ? 'msg-success' : 'msg-warn'}`}>
                  {waterResultMsg}
                </div>
              )}
              {waterPhase === 'failed' && (
                <div className="msg-error" style={{ marginTop: '10px' }}>Daal Spoiled!</div>
              )}
            </div>

            {/* Spacer - pour stream is rendered on lota element */}
            <div className="water-pot-zone" />
          </div>
        )}

        {/* Floating Lota — draggable water container */}
        {(waterPhase === 'active' || waterPhase === 'failed') && transitionState === 'interactive' && (
          <div
            ref={lotaRef}
            className={`water-lota-draggable ${lotaDragState ? 'lota-being-dragged' : ''} ${isOverPourZone ? 'lota-pouring-tilt' : ''}`}
            style={lotaStyle}
            onPointerDown={handleLotaPointerDown}
            onPointerMove={handleLotaPointerMove}
            onPointerUp={handleLotaPointerUp}
            onPointerCancel={handleLotaPointerUp}
            id="water-lota-draggable"
            title="Drag this water lota to the pot to pour"
          >
            <div className="lota-body">
              <span className="lota-emoji">🏺</span>
              <span className="lota-label">Water Lota</span>
            </div>
            {!lotaDragState && (
              <div className="lota-drag-hint">← Drag to pot</div>
            )}
            {/* Pour stream — attached to lota so it always appears at its actual position */}
            {isPouringActive && (
              <div className="pour-water-stream" style={{ position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                <div className="water-drop wd1">💧</div>
                <div className="water-drop wd2">💧</div>
                <div className="water-drop wd3">💧</div>
              </div>
            )}
          </div>
        )}

        {/* Water Success Banner — auto-hides after 1.8s so it stops blocking the pot */}
        {showWaterBanner && (
          <div className="water-success-banner" id="water-success-banner" style={{ pointerEvents: 'none', zIndex: 200 }}>
            <span className="success-icon">💧</span>
            <span className="success-text">Perfect Water Level!</span>
            <span className="success-icon">✨</span>
          </div>
        )}

        {/* Boiling Daal Transition Video */}
        {(transitionState === 'video_playing' || transitionState === 'fading_to_next') && (
          <div
            className={`frame3-video-transition-wrapper ${transitionState === 'fading_to_next' ? 'transition-video-fade-out' : 'transition-video-fade-in'}`}
            id="boiling-daal-transition-container"
          >
            <video
              ref={transitionVideoRef}
              src={transitionVideo}
              className="frame3-transition-video-player"
              autoPlay
              playsInline
              onEnded={handleTransitionVideoEnded}
              onError={handleTransitionVideoError}
            />
          </div>
        )}

        {/* Spoiled Daal Transition Video */}
        {transitionState === 'spoiled_video_playing' && (
          <div
            className="frame3-video-transition-wrapper transition-video-fade-in"
            id="spoiled-daal-transition-container"
            style={{ zIndex: 1000 }}
          >
            <video
              src={spoiledVideo}
              className="frame3-transition-video-player"
              autoPlay
              playsInline
              onEnded={handleSpoiledVideoEnded}
              onError={handleSpoiledVideoEnded}
            />
          </div>
        )}
      </div>
    </div>
  )
}
