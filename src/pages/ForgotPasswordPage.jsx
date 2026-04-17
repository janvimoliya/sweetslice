import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/AuthRecoveryPage.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      setErrorMessage('Email is required')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('http://localhost:5000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.message || 'Unable to process request right now')
      }

      setSuccessMessage(result.message || 'If this email is registered, a password reset link has been sent.')
      setEmail('')
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-recovery-page">
      <div className="auth-recovery-card">
        <h1>Forgot Password</h1>
        <p>Enter your account email and we will send you a reset link.</p>

        {successMessage && <div className="auth-recovery-alert success">{successMessage}</div>}
        {errorMessage && <div className="auth-recovery-alert error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-recovery-form" noValidate>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-recovery-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
