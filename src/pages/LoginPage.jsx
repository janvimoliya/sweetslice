import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { rules, useFormValidation } from '../validation/formValidation'
import '../styles/LoginPage.css'

function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const apiBaseUrl = 'http://localhost:5000'
    const redirectTo =
        typeof location.state?.redirectTo === 'string' && location.state.redirectTo.startsWith('/')
            ? location.state.redirectTo
            : '/'

    const isEmailValue = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

    const validationRules = {
        email: [
            rules.required('Email or Admin ID is required'),
            (value) => {
                const identity = String(value || '').trim()
                if (!identity) return ''
                if (isEmailValue(identity) || identity.toLowerCase() === 'admin') return ''
                return 'Enter a valid email or admin ID'
            },
        ],
        password: [rules.required('Password is required'), rules.minLength(6)],
    }

    const { values, errors, handleChange, handleBlur, handleSubmit, resetForm } =
        useFormValidation({
            initialValues: {
                email: '',
                password: '',
            },
            validationRules,
            onSubmit: async (formValues) => {
                setIsSubmitting(true)
                setSubmitMessage('')
                setSubmitError('')
                const loginIdentity = String(formValues.email || '').trim()
                const normalizedIdentity = loginIdentity.toLowerCase()
                const isAdminLoginAttempt = !isEmailValue(loginIdentity) && normalizedIdentity === 'admin'

                try {
                    const endpoint = isAdminLoginAttempt ? `${apiBaseUrl}/api/admin/login` : `${apiBaseUrl}/api/users/login`
                    const payload = isAdminLoginAttempt
                        ? {
                              adminId: normalizedIdentity,
                              password: formValues.password,
                          }
                        : {
                              email: normalizedIdentity,
                              password: formValues.password,
                          }

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })

                    const result = await response.json().catch(() => ({}))

                    if (!response.ok) {
                        const errorMsg = result.message || 'Login failed. Please check your credentials.';
                        console.error('Login error:', { status: response.status, error: errorMsg, result });
                        throw new Error(errorMsg);
                    }

                    if (!result.data) {
                        throw new Error('Invalid response from server');
                    }

                    if (isAdminLoginAttempt) {
                        const adminId = result.data?.adminId || normalizedIdentity
                        const adminToken = result.data?.token

                        if (!adminToken) {
                            throw new Error('Admin token not received from server')
                        }

                        localStorage.removeItem('userToken')
                        localStorage.removeItem('userId')
                        localStorage.removeItem('userEmail')
                        localStorage.removeItem('userName')
                        localStorage.removeItem('userProfile')
                        window.dispatchEvent(new Event('auth-changed'))

                        localStorage.setItem('adminId', adminId)
                        localStorage.setItem('adminToken', adminToken)

                        setSubmitMessage('Admin login successful! Redirecting...')
                        resetForm()

                        setTimeout(() => {
                            navigate('/admin/panel')
                        }, 1200)

                        return
                    }

                    const userId = result.data?.userId || result.data?.id
                    const token = result.data?.token

                    if (!userId) {
                        throw new Error('User ID not received from server')
                    }

                    localStorage.setItem('userId', userId)
                    localStorage.setItem('userEmail', result.data?.email || normalizedIdentity)
                    localStorage.setItem('userName', result.data?.fullName || '')
                    if (token) {
                        localStorage.setItem('userToken', token)
                    }
                    window.dispatchEvent(new Event('auth-changed'))

                    setSubmitMessage('Login successful! Redirecting...')
                    resetForm();

                    setTimeout(() => {
                        navigate(redirectTo);
                    }, 1500);
                } catch (error) {
                    console.error('Login exception:', error);
                    setSubmitError(error.message || 'Login failed. Please try again.');
                } finally {
                    setIsSubmitting(false);
                }
            },
        })

    return (
        <div className="login-page-wrapper">
            <div className="login-container-modern">
                {/* Left Side - Branding & Features */}
                <div className="login-left-section">
                    <div className="branding-section">
                        <div className="logo-large">🍰</div>
                        <h1>SweetSlice</h1>
                        <p className="tagline">Freshly Baked Happiness</p>
                    </div>

                    <div className="features-showcase">
                        <div className="feature-item">
                            <div className="feature-icon">🚚</div>
                            <h4>Fast Delivery</h4>
                            <p>Get your favorite cakes delivered fresh</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💳</div>
                            <h4>Secure Payment</h4>
                            <p>Multiple payment options available</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⭐</div>
                            <h4>Premium Quality</h4>
                            <p>Only the finest ingredients used</p>
                        </div>
                    </div>

                    <div className="testimonial">
                        <p className="quote">"Best cakes I've ever tasted! Highly recommended."</p>
                        <p className="author">- Sarah M.</p>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="login-right-section">
                    <div className="form-wrapper">
                        <h2 className="form-title">Welcome Back</h2>
                        <p className="form-subtitle">Enter your credentials to continue</p>

                        {submitMessage && (
                            <div className="alert alert-success-modern">
                                <i className="bi bi-check-circle"></i>
                                {submitMessage}
                            </div>
                        )}
                        {submitError && (
                            <div className="alert alert-error-modern">
                                <i className="bi bi-exclamation-circle"></i>
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="login-form-modern">
                            <div className="form-group-modern">
                                <label htmlFor="email" className="form-label-modern">
                                    <i className="bi bi-envelope"></i> Email Address or Admin ID
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className={`form-input-modern ${errors.email ? 'error' : ''}`}
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="you@example.com or admin"
                                />
                                {errors.email && <span className="error-message-modern">{errors.email}</span>}
                            </div>

                            <div className="form-group-modern">
                                <div className="label-with-action">
                                    <label htmlFor="password" className="form-label-modern">
                                        <i className="bi bi-lock"></i> Password
                                    </label>
                                    <Link to="/forgot-password" className="link-action">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="password-input-wrapper">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className={`form-input-modern ${errors.password ? 'error' : ''}`}
                                        value={values.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-modern"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                                    </button>
                                </div>
                                {errors.password && <span className="error-message-modern">{errors.password}</span>}
                            </div>

                            <div className="remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Remember me for 30 days</label>
                            </div>

                            <button
                                type="submit"
                                className="btn-submit-modern"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner"></span> Signing In...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-in-right"></i> Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="divider-modern">
                            <span>Don't have an account?</span>
                        </div>

                        <Link to="/register" className="btn-register-modern">
                            <i className="bi bi-person-plus"></i> Create New Account
                        </Link>

                        <div className="login-footer-modern">
                            <p>By signing in, you agree to our <a href="#terms">Terms of Service</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
