function CakeParticlesLayer({ className = '' }) {
  const classes = `cake-particles-layer ${className}`.trim()

  return (
    <div className={classes} aria-hidden="true">
      <span className="cake-particle">🎂</span>
      <span className="cake-particle">🧁</span>
      <span className="cake-particle">🍰</span>
      <span className="cake-particle">🍪</span>
      <span className="cake-particle">🎂</span>
      <span className="cake-particle">🧁</span>
      <span className="cake-particle">🍰</span>
      <span className="cake-particle">🍪</span>
    </div>
  )
}

export default CakeParticlesLayer
