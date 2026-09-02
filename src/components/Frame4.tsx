import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { BAATI_PREPARATION_RECIPE, INGREDIENT_COLORS, RecipeStep } from '../data/recipe'
import { ProgressBar } from './ProgressBar'
import frame4BgVideo from '../../video frames/gamebackgroundframe4.mp4'
import backgroundSong from '../../sounds/backgroundSong1.mp3'
import './Frame4.css'

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

// Stages of Frame 4
type BaatiStage =
  | 'ingredients'   // Stage 1 – drag ingredients to bowl
  | 'kneading'      // Stage 2 – knead dough with pointer movement
  | 'shaping'       // Stage 3 – shape dough into round baati
  | 'placement'     // Stage 4 – drag shaped baati to plate
  | 'complete'      // Done

// Ingredients for stages 1 (all except baati-raw)
const DOUGH_INGREDIENTS = BAATI_PREPARATION_RECIPE.filter(s => s.id !== 'baati-raw')

// Kneading / Shaping thresholds (cumulative pointer distance in px)
const KNEAD_THRESHOLD = 1800  // pixels of movement needed
const SHAPE_THRESHOLD = 1200

export const Frame4: React.FC = () => {
  const { resetGame, setCurrentFrame } = useGame()

  // ── Stage Management ────────────────────────────────────────────────────────
  const [baatiStage, setBaatiStage] = useState<BaatiStage>('ingredients')

  // ── Stage 1: Ingredients ────────────────────────────────────────────────────
  const [completedIngredients, setCompletedIngredients] = useState<string[]>([])
  const [dragState, setDragState] = useState<DraggingState | null>(null)
  const [isBowlHovered, setIsBowlHovered] = useState(false)
  const [bowlSplash, setBowlSplash] = useState<string | null>(null)
  const [shakingIngredient, setShakingIngredient] = useState<string | null>(null)

  // ── Stage 2: Kneading ──────────────────────────────────────────────────────
  const [kneadProgress, setKneadProgress] = useState(0)
  const [isKneading, setIsKneading] = useState(false)
  const [kneadComplete, setKneadComplete] = useState(false)

  // ── Stage 3: Shaping ───────────────────────────────────────────────────────
  const [shapeProgress, setShapeProgress] = useState(0)
  const [isShaping, setIsShaping] = useState(false)
  const [shapeComplete, setShapeComplete] = useState(false)

  // ── Stage 4: Placement ──────────────────────────────────────────────────────
  const [isPlateHovered, setIsPlateHovered] = useState(false)
  const [plateSplash, setPlateSplash] = useState<string | null>(null)
  const [baatiPlaced, setBaatiPlaced] = useState(false)
  const [baatiDragState, setBaatiDragState] = useState<DraggingState | null>(null)

  // ── Guidance ──────────────────────────────────────────────────────────────
  const [guidanceMessage, setGuidanceMessage] = useState<string>('')

  // ── Sound ─────────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundMenuRef = useRef<HTMLDivElement | null>(null)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const stageRef = useRef<HTMLDivElement>(null)
  const bowlRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const kneadZoneRef = useRef<HTMLDivElement>(null)
  const shapeZoneRef = useRef<HTMLDivElement>(null)
  const pointerIdRef = useRef<number | null>(null)
  const baatiPointerIdRef = useRef<number | null>(null)

  // Tracking previous pointer position for distance calc
  const prevKneadPosRef = useRef<{x: number; y: number} | null>(null)
  const prevShapePosRef = useRef<{x: number; y: number} | null>(null)
  const kneadProgressRef = useRef(0)
  const shapeProgressRef = useRef(0)

  const completedSet = new Set(completedIngredients)
  const allDoughIngredients = DOUGH_INGREDIENTS.every(s => completedSet.has(s.ingredient))
  const currentIngredientStep = DOUGH_INGREDIENTS.find(s => !completedSet.has(s.ingredient))

  // ── Progress bar step ─────────────────────────────────────────────────────
  const progressStep = (() => {
    if (baatiStage === 'complete') return BAATI_PREPARATION_RECIPE.length
    if (baatiStage === 'placement') return 5
    if (baatiStage === 'shaping') return 4
    if (baatiStage === 'kneading') return completedIngredients.length
    return completedIngredients.length
  })()

  // ── Audio Setup ───────────────────────────────────────────────────────────
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

  // ── Guidance Updates ──────────────────────────────────────────────────────
  useEffect(() => {
    switch (baatiStage) {
      case 'ingredients':
        if (currentIngredientStep) {
          setGuidanceMessage(`Step ${completedIngredients.length + 1}: Drag ${currentIngredientStep.label} into the preparation bowl`)
        } else {
          setGuidanceMessage('All ingredients added! Get ready to knead the dough...')
        }
        break
      case 'kneading':
        if (kneadComplete) {
          setGuidanceMessage('Dough kneaded! Now shape the Baati...')
        } else {
          setGuidanceMessage('Press & move over the dough to knead it! Keep moving!')
        }
        break
      case 'shaping':
        if (shapeComplete) {
          setGuidanceMessage('Baati shaped! Drag it onto the traditional plate!')
        } else {
          setGuidanceMessage('Press & move in circles to shape the round Baati!')
        }
        break
      case 'placement':
        setGuidanceMessage('Drag the formed Baati onto the central dish!')
        break
      case 'complete':
        setGuidanceMessage('Royal Baati Complete! Authentic Rajasthani Baati is ready!')
        break
    }
  }, [baatiStage, completedIngredients.length, currentIngredientStep, kneadComplete, shapeComplete])

  // ── Transition from ingredients to kneading ───────────────────────────────
  useEffect(() => {
    if (allDoughIngredients && baatiStage === 'ingredients') {
      setTimeout(() => setBaatiStage('kneading'), 600)
    }
  }, [allDoughIngredients, baatiStage])

  // ── Bowl collision check ───────────────────────────────────────────────────
  const checkBowlCollision = useCallback((clientX: number, clientY: number): boolean => {
    if (!bowlRef.current) return false
    const rect = bowlRef.current.getBoundingClientRect()
    const hitBuffer = 35
    return clientX >= rect.left - hitBuffer && clientX <= rect.right + hitBuffer &&
           clientY >= rect.top - hitBuffer && clientY <= rect.bottom + hitBuffer
  }, [])

  // ── Plate collision check ─────────────────────────────────────────────────
  const checkPlateCollision = useCallback((clientX: number, clientY: number): boolean => {
    if (!plateRef.current) return false
    const rect = plateRef.current.getBoundingClientRect()
    const hitBuffer = 35
    return clientX >= rect.left - hitBuffer && clientX <= rect.right + hitBuffer &&
           clientY >= rect.top - hitBuffer && clientY <= rect.bottom + hitBuffer
  }, [])

  // ── Stage 1: Ingredient drag handlers ────────────────────────────────────
  const handleIngredientPointerDown = (e: React.PointerEvent<HTMLDivElement>, step: RecipeStep) => {
    if (audioRef.current && audioRef.current.paused && !isMuted) audioRef.current.play().catch(() => {})
    if (completedSet.has(step.ingredient) || dragState !== null || baatiStage !== 'ingredients') return
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
  }

  const handleIngredientPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.isSnapping) return
    const isOverBowl = checkBowlCollision(e.clientX, e.clientY)
    if (isOverBowl !== isBowlHovered) setIsBowlHovered(isOverBowl)
    setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null)
  }

  const handleIngredientPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.isSnapping) return
    const targetEl = e.currentTarget
    try {
      if (pointerIdRef.current !== null && targetEl.hasPointerCapture(pointerIdRef.current)) {
        targetEl.releasePointerCapture(pointerIdRef.current)
      }
    } catch { /* safe */ }
    pointerIdRef.current = null

    const isOverBowl = checkBowlCollision(e.clientX, e.clientY)
    const ingredientId = dragState.ingredientId
    setIsBowlHovered(false)

    if (isOverBowl) {
      // Validate order
      if (currentIngredientStep && currentIngredientStep.ingredient === ingredientId) {
        setCompletedIngredients(prev => [...prev, ingredientId])
        setBowlSplash(ingredientId)
        setTimeout(() => setBowlSplash(null), 800)
        setDragState(null)
      } else {
        setGuidanceMessage(`Ruko! Pehle ${currentIngredientStep?.label} daalo`)
        setDragState(prev => prev ? { ...prev, isSnapping: true, hasError: true } : null)
        setShakingIngredient(ingredientId)
        setTimeout(() => { setShakingIngredient(null); setDragState(null) }, 380)
      }
    } else {
      setDragState(prev => prev ? { ...prev, isSnapping: true } : null)
      setTimeout(() => setDragState(null), 250)
    }
  }

  const handleIngredientPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => handleIngredientPointerUp(e)

  // ── Stage 2: Kneading handlers ────────────────────────────────────────────
  const handleKneadZonePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (kneadComplete || baatiStage !== 'kneading') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsKneading(true)
    prevKneadPosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleKneadZonePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isKneading || kneadComplete) return
    if (prevKneadPosRef.current) {
      const dx = e.clientX - prevKneadPosRef.current.x
      const dy = e.clientY - prevKneadPosRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      // Only count genuine movement (ignore tiny jitter)
      if (dist > 2) {
        kneadProgressRef.current = Math.min(KNEAD_THRESHOLD, kneadProgressRef.current + dist)
        const pct = (kneadProgressRef.current / KNEAD_THRESHOLD) * 100
        setKneadProgress(pct)
        if (kneadProgressRef.current >= KNEAD_THRESHOLD && !kneadComplete) {
          setKneadComplete(true)
          setIsKneading(false)
          setTimeout(() => setBaatiStage('shaping'), 800)
        }
      }
    }
    prevKneadPosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleKneadZonePointerUp = () => {
    setIsKneading(false)
    prevKneadPosRef.current = null
  }

  // ── Stage 3: Shaping handlers ─────────────────────────────────────────────
  const handleShapeZonePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shapeComplete || baatiStage !== 'shaping') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsShaping(true)
    prevShapePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleShapeZonePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isShaping || shapeComplete) return
    if (prevShapePosRef.current) {
      const dx = e.clientX - prevShapePosRef.current.x
      const dy = e.clientY - prevShapePosRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 2) {
        shapeProgressRef.current = Math.min(SHAPE_THRESHOLD, shapeProgressRef.current + dist)
        const pct = (shapeProgressRef.current / SHAPE_THRESHOLD) * 100
        setShapeProgress(pct)
        if (shapeProgressRef.current >= SHAPE_THRESHOLD && !shapeComplete) {
          setShapeComplete(true)
          setIsShaping(false)
          setTimeout(() => setBaatiStage('placement'), 800)
        }
      }
    }
    prevShapePosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleShapeZonePointerUp = () => {
    setIsShaping(false)
    prevShapePosRef.current = null
  }

  // ── Stage 4: Baati placement drag handlers ────────────────────────────────
  const handleBaatiPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (baatiPlaced || baatiDragState !== null || baatiStage !== 'placement') return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    const targetEl = e.currentTarget
    const rect = targetEl.getBoundingClientRect()
    targetEl.setPointerCapture(e.pointerId)
    baatiPointerIdRef.current = e.pointerId

    setBaatiDragState({
      ingredientId: 'baati-raw',
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: rect.left,
      startY: rect.top,
      isSnapping: false,
      hasError: false
    })
  }

  const handleBaatiPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!baatiDragState || baatiDragState.isSnapping) return
    const isOver = checkPlateCollision(e.clientX, e.clientY)
    if (isOver !== isPlateHovered) setIsPlateHovered(isOver)
    setBaatiDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null)
  }

  const handleBaatiPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!baatiDragState || baatiDragState.isSnapping) return
    const targetEl = e.currentTarget
    try {
      if (baatiPointerIdRef.current !== null && targetEl.hasPointerCapture(baatiPointerIdRef.current)) {
        targetEl.releasePointerCapture(baatiPointerIdRef.current)
      }
    } catch { /* safe */ }
    baatiPointerIdRef.current = null

    const isOver = checkPlateCollision(e.clientX, e.clientY)
    setIsPlateHovered(false)

    if (isOver) {
      setBaatiPlaced(true)
      setPlateSplash('baati')
      setTimeout(() => setPlateSplash(null), 800)
      setBaatiDragState(null)
      setBaatiStage('complete')
    } else {
      setBaatiDragState(prev => prev ? { ...prev, isSnapping: true } : null)
      setTimeout(() => setBaatiDragState(null), 250)
    }
  }

  const handleBaatiPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => handleBaatiPointerUp(e)

  const handleRestart = () => {
    resetGame()
    setCurrentFrame('frame1')
  }

  // Dough visual based on kneading progress
  const getDoughScale = () => {
    const pct = kneadProgress / 100
    return 0.8 + pct * 0.4
  }

  return (
    <div
      className="frame-stage frame4-stage"
      ref={stageRef}
    >
      {/* Background Audio */}
      <audio ref={audioRef} src={backgroundSong} loop playsInline />

      {/* Top Fixed Progress Bar */}
      <ProgressBar
        label="BAATI PREPARATION"
        currentStep={progressStep}
        totalSteps={BAATI_PREPARATION_RECIPE.length}
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

      {/* Main Kitchen Stage */}
      <div
        className="frame4-canvas-area"
        onPointerMove={(e) => {
          handleIngredientPointerMove(e)
          handleBaatiPointerMove(e)
        }}
      >
        {/* Background Video */}
        <video
          src={frame4BgVideo}
          className="frame-bg-image frame4-bg"
          autoPlay loop muted playsInline
        />

        {/* Ambient Steam from Daal Kadai (background) */}
        <div className="bg-daal-kadai-steam" title="Daal Simmering on Chulha">
          <div className="simmer-steam-particle steam-p1"></div>
          <div className="simmer-steam-particle steam-p2"></div>
          <div className="simmer-steam-particle steam-p3"></div>
        </div>

        {/* ══ Stage 1: INGREDIENT DRAG-DROP ══ */}
        {baatiStage === 'ingredients' && (
          <>
            {/* Central preparation bowl — drop target */}
            <div
              ref={bowlRef}
              className={`baati-prep-bowl-target ${isBowlHovered ? 'bowl-hovered' : ''} ${bowlSplash ? 'bowl-active' : ''}`}
              id="baati-prep-bowl-target"
            >
              <div className="bowl-aura-ring" />
              <div className="bowl-interior-content">
                {completedSet.has('flour') && <div className="bowl-flour-layer" />}
                {completedSet.has('sooji') && <div className="bowl-sooji-texture" />}
                {completedSet.has('ajwain') && <div className="bowl-ajwain-specks" />}
                {completedSet.has('ghee') && <div className="bowl-ghee-glaze" />}
                {completedSet.has('water-baati') && <div className="bowl-water-sheen" />}
              </div>
              {bowlSplash && (
                <div className="bowl-splash-burst">
                  <span>✨</span><span>🌾</span>
                </div>
              )}
              {!bowlSplash && completedIngredients.length === 0 && (
                <div className="bowl-drop-label">⬇ DROP HERE</div>
              )}
            </div>

            {/* Ingredient draggable pills */}
            {DOUGH_INGREDIENTS.map((step) => {
              const isCompleted = completedSet.has(step.ingredient)
              const isCurrent = currentIngredientStep?.ingredient === step.ingredient
              const isBeingDragged = dragState?.ingredientId === step.ingredient
              const isShaking = shakingIngredient === step.ingredient

              return (
                <div
                  key={step.id}
                  className={`ingredient-hotspot ${isCompleted ? 'ingredient-used' : ''} ${isCurrent ? 'ingredient-next-up' : ''} ${isShaking ? 'ingredient-error-shake' : ''}`}
                  style={{
                    left: step.position.left,
                    top: step.position.top,
                    opacity: isBeingDragged ? 0.25 : 1
                  }}
                  onPointerDown={(e) => handleIngredientPointerDown(e, step)}
                  onPointerUp={handleIngredientPointerUp}
                  onPointerCancel={handleIngredientPointerCancel}
                  id={`baati-ingredient-${step.ingredient}`}
                  title={`Drag ${step.label} (${step.hindiLabel}) to the bowl`}
                >
                  <div className="ingredient-pill-tag" style={{ borderColor: step.color }}>
                    <span className="tag-icon">{step.icon}</span>
                    <span className="tag-text">{step.label}</span>
                    {isCompleted && <span className="tag-check">✓</span>}
                  </div>
                </div>
              )
            })}

            {/* Drag avatar */}
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
                    {DOUGH_INGREDIENTS.find(s => s.ingredient === dragState.ingredientId)?.icon || '🌾'}
                  </span>
                  <span className="avatar-label">
                    {DOUGH_INGREDIENTS.find(s => s.ingredient === dragState.ingredientId)?.label}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ Stage 2: KNEADING MINI-GAME ══ */}
        {baatiStage === 'kneading' && (
          <div className="kneading-stage-overlay" id="kneading-stage-overlay">
            {/* Background Dough Mound visual */}
            <div className="kneading-scene">
              {/* Progress bar */}
              <div className="minigame-progress-panel">
                <div className="minigame-progress-label">
                  <span className="progress-icon">🤲</span>
                  KNEADING
                </div>
                <div className="minigame-progress-track">
                  <div
                    className="minigame-progress-fill kneading-fill"
                    style={{ width: `${kneadProgress}%` }}
                  />
                  <div className="minigame-progress-text">{Math.round(kneadProgress)}%</div>
                </div>
                {kneadComplete && (
                  <div className="minigame-complete-badge">✓ DOUGH READY!</div>
                )}
              </div>

              {/* The interactive dough zone */}
              <div className="kneading-dough-container">
                <div
                  ref={kneadZoneRef}
                  className={`kneading-dough-zone ${isKneading ? 'dough-being-kneaded' : ''} ${kneadComplete ? 'dough-kneaded-done' : ''}`}
                  onPointerDown={handleKneadZonePointerDown}
                  onPointerMove={handleKneadZonePointerMove}
                  onPointerUp={handleKneadZonePointerUp}
                  onPointerLeave={handleKneadZonePointerUp}
                  onPointerCancel={handleKneadZonePointerUp}
                  id="kneading-dough-zone"
                  style={{ transform: `scale(${getDoughScale()})` }}
                >
                  <div className="dough-blob-visual">
                    <span className="dough-emoji">🫓</span>
                    {isKneading && <div className="knead-ripple"></div>}
                  </div>
                  {!kneadComplete && (
                    <div className="dough-press-hint">
                      Press & Move
                    </div>
                  )}
                  {kneadComplete && (
                    <div className="dough-done-glow"></div>
                  )}
                </div>

                <div className="kneading-instruction-card">
                  <p className="knead-instr">
                    {kneadComplete
                      ? '✨ Dough is perfectly kneaded!'
                      : '🤲 Press and move your pointer over the dough to knead it'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Stage 3: SHAPING MINI-GAME ══ */}
        {baatiStage === 'shaping' && (
          <div className="shaping-stage-overlay" id="shaping-stage-overlay">
            <div className="shaping-scene">
              {/* Progress bar */}
              <div className="minigame-progress-panel">
                <div className="minigame-progress-label">
                  <span className="progress-icon">🧆</span>
                  SHAPING
                </div>
                <div className="minigame-progress-track">
                  <div
                    className="minigame-progress-fill shaping-fill"
                    style={{ width: `${shapeProgress}%` }}
                  />
                  <div className="minigame-progress-text">{Math.round(shapeProgress)}%</div>
                </div>
                {shapeComplete && (
                  <div className="minigame-complete-badge">✓ BAATI SHAPED!</div>
                )}
              </div>

              {/* Interactive shaping zone */}
              <div className="shaping-dough-container">
                <div
                  ref={shapeZoneRef}
                  className={`shaping-dough-zone ${isShaping ? 'dough-being-shaped' : ''} ${shapeComplete ? 'dough-shaped-done' : ''}`}
                  onPointerDown={handleShapeZonePointerDown}
                  onPointerMove={handleShapeZonePointerMove}
                  onPointerUp={handleShapeZonePointerUp}
                  onPointerLeave={handleShapeZonePointerUp}
                  onPointerCancel={handleShapeZonePointerUp}
                  id="shaping-dough-zone"
                >
                  <div className="shape-dough-visual">
                    {/* Dough becomes rounder as progress increases */}
                    <div
                      className={`shape-blob ${shapeComplete ? 'shape-blob-round' : ''}`}
                      style={{
                        borderRadius: `${20 + (shapeProgress / 100) * 30}%`,
                        transform: `scale(${0.7 + (shapeProgress / 100) * 0.5})`
                      }}
                    >
                      <span className="shape-dough-inner">
                        {shapeComplete ? '🧆' : '🫓'}
                      </span>
                    </div>
                    {isShaping && <div className="shape-ripple"></div>}
                    {!shapeComplete && shapeProgress > 30 && (
                      <div className="shape-glow-partial"></div>
                    )}
                    {shapeComplete && <div className="shape-glow-complete"></div>}
                  </div>

                  {!shapeComplete && (
                    <div className="shape-press-hint">Press & move in circles</div>
                  )}
                </div>

                <div className="shaping-instruction-card">
                  <p className="shape-instr">
                    {shapeComplete
                      ? '✨ Baati shaped perfectly! Now place it on the dish!'
                      : '🖐 Move your pointer in circular motion to shape the round Baati'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Stage 4: BAATI PLACEMENT ══ */}
        {(baatiStage === 'placement' || baatiStage === 'complete') && (
          <>
            {/* Central Plate Drop Zone */}
            <div
              ref={plateRef}
              className={`central-traditional-dish-target ${isPlateHovered ? 'dish-hovered' : ''} ${plateSplash ? 'dish-active' : ''}`}
              id="central-baati-dish-target"
            >
              <div className="dish-aura-ring" />
              <div className="dish-interior-content">
                {baatiPlaced && (
                  <div className="placed-baatis-cluster">
                    <div className="royal-baati-ball b1">🧆</div>
                    <div className="royal-baati-ball b2">🧆</div>
                    <div className="royal-baati-ball b3">🧆</div>
                    <div className="royal-baati-ball b4">🧆</div>
                    <div className="royal-baati-ball b5">🧆</div>
                  </div>
                )}
              </div>
              {plateSplash && (
                <div className="dish-splash-burst">
                  <span className="splash-sparkle">✨</span>
                  <span className="splash-bubble">🌾</span>
                </div>
              )}
              {!baatiPlaced && (
                <div className="dish-drop-label">⬇ DROP BAATI HERE</div>
              )}
            </div>

            {/* Draggable formed Baati (Stage 4 only) */}
            {!baatiPlaced && baatiStage === 'placement' && (
              <div
                className={`formed-baati-draggable ${baatiDragState ? 'baati-being-dragged' : ''}`}
                style={{
                  position: baatiDragState ? 'fixed' : 'absolute',
                  left: baatiDragState
                    ? (baatiDragState.isSnapping ? `${baatiDragState.startX}px` : `${baatiDragState.currentX - baatiDragState.offsetX}px`)
                    : '26%',
                  top: baatiDragState
                    ? (baatiDragState.isSnapping ? `${baatiDragState.startY}px` : `${baatiDragState.currentY - baatiDragState.offsetY}px`)
                    : '68%',
                  zIndex: baatiDragState ? 900 : 50,
                  pointerEvents: baatiStage === 'placement' ? 'auto' : 'none'
                }}
                onPointerDown={handleBaatiPointerDown}
                onPointerUp={handleBaatiPointerUp}
                onPointerCancel={handleBaatiPointerCancel}
                id="formed-baati-draggable"
                title="Drag Baati to the central dish"
              >
                <div className="formed-baati-body">
                  <span className="formed-baati-emoji">🧆</span>
                  <span className="formed-baati-label">तैयार बाटी</span>
                </div>
                {!baatiDragState && (
                  <div className="baati-drag-hint">Drag to plate →</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══ Guidance Bar (always visible) ══ */}
        <div className="recipe-guidance-bar">
          <div className="guidance-ornament">❖</div>
          <p className="guidance-text">{guidanceMessage}</p>
          <div className="guidance-ornament">❖</div>
        </div>

        {/* ══ Completion Modal ══ */}
        {baatiStage === 'complete' && (
          <div className="baati-complete-modal-overlay">
            <div className="royal-card baati-complete-card">
              <div className="card-corner corner-tl"></div>
              <div className="card-corner corner-tr"></div>
              <div className="card-corner corner-bl"></div>
              <div className="card-corner corner-br"></div>

              <div className="royal-emblem">❖ शाही बाटी तैयार ❖</div>
              <h2 className="complete-title">ROYAL BAATI COMPLETE!</h2>
              <p className="complete-subtitle">Authentic Rajasthani Baati Formed & Plated</p>

              <div className="title-divider">
                <span className="divider-line"></span>
                <span className="divider-gem">♦</span>
                <span className="divider-line"></span>
              </div>

              <div className="complete-summary-box">
                <p className="complete-desc">
                  You have mastered the authentic preparation — mixing, kneading, shaping and plating the traditional round Baatis with pure desi ghee!
                </p>
                <div className="ingredients-checklist">
                  <span className="checklist-badge">✓ Coarse Wheat Flour</span>
                  <span className="checklist-badge">✓ Sooji</span>
                  <span className="checklist-badge">✓ Ajwain</span>
                  <span className="checklist-badge">✓ Desi Ghee</span>
                  <span className="checklist-badge">✓ Lukewarm Water</span>
                  <span className="checklist-badge">✓ Kneaded & Shaped</span>
                  <span className="checklist-badge">✓ Plated Baati</span>
                </div>
              </div>

              <div className="complete-actions">
                <button
                  className="btn-rajasthani replay-btn"
                  onClick={handleRestart}
                  id="baati-replay-btn"
                >
                  PLAY AGAIN ↺
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
