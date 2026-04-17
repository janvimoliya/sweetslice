import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import '../styles/AuthRecoveryPage.css'

function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!token) {
      setErrorMessage('Reset token is missing from URL')
      return
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Password and confirm password are required')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`http://localhost:5000/api/users/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.message || 'Unable to reset password')
      }

      setSuccessMessage(result.message || 'Password reset successful. Redirecting to login...')
      setPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-recovery-page">
      <div className="auth-recovery-card">
        <h1>Reset Password</h1>
        <p>Set your new password to regain access to your account.</p>

        {successMessage && <div className="auth-recovery-alert success">{successMessage}</div>}
        {errorMessage && <div className="auth-recovery-alert error">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-recovery-form" noValidate>
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Retype your password"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="auth-recovery-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
