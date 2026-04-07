import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { rules, useFormValidation } from '../validation/formValidation'
import '../styles/RegisterPage.css'


function RegisterPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [profilePreview, setProfilePreview] = useState('')
    const [editId, setEditId] = useState('')
    const [existingProfilePreview, setExistingProfilePreview] = useState('')
    const [showRegisterPassword, setShowRegisterPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)


    const apiBaseUrl = 'http://localhost:5000'

    const addressFormatRule = (message = 'Must enter address.') => (value) => {
        if (!value) return ''
        const addressRegex = /^[A-Za-z0-9\s,./#-]{5,}$/
        return addressRegex.test(String(value).trim()) ? '' : message
    }


    const validationRules = {
        fullName: [rules.required('Full name is required'), rules.alphabetic(), rules.minLength(3)],
        registerEmail: [rules.required('Email is required'), rules.email()],
        mobile: [rules.required('Mobile number is required'), rules.numeric(), rules.minLength(10), rules.maxLength(15)],
        gender: [rules.required('Please select a gender')],
        address: [rules.required('Address is required'), addressFormatRule(), rules.maxLength(250)],
        registerPassword: editId ? [] : [rules.required('Password is required'), rules.minLength(8)],
        confirmPassword: editId
            ? []
            : [
                rules.required('Please confirm password'),
                rules.matchField('registerPassword', 'Passwords do not match'),
            ],
        acceptTerms: [rules.required('You must accept terms to continue')],
    }


    const {
        values,
        errors,
        handleChange,
        handleBlur,
        handleSubmit,
        getInputClass,
        setFieldValue,
        resetForm,
    } = useFormValidation({
        initialValues: {
            fullName: '',
            mobile: '',
            gender: '',
            address: '',
            profilePicture: null,
            registerEmail: '',
            registerPassword: '',
            confirmPassword: '',
            acceptTerms: false,
        },
        validationRules,
        onSubmit: async (formValues) => {
            setIsSubmitting(true)
            setSubmitMessage('')
            setSubmitError('')


            try {
                const normalizedEmail = String(formValues.registerEmail || '').trim().toLowerCase()
                const payload = new FormData()
                payload.append('fullName', formValues.fullName)
                payload.append('email', normalizedEmail)
                payload.append('mobile', formValues.mobile)
                payload.append('gender', formValues.gender)
                payload.append('address', formValues.address)
                payload.append('terms', String(formValues.acceptTerms))


                if (!editId) {
                    payload.append('password', formValues.registerPassword)
                    payload.append('confirmPassword', formValues.confirmPassword)
                }


                if (formValues.profilePicture) {
                    payload.append('profile_picture', formValues.profilePicture)
                }


                // Use User controller endpoint for registration (with password hashing)
                const endpoint = editId ? `${apiBaseUrl}/api/users/${editId}` : `${apiBaseUrl}/api/users/register`
                const response = await fetch(endpoint, {
                    method: editId ? 'PUT' : 'POST',
                    body: payload,
                })


                const result = await response.json().catch(() => ({}))

                console.log('[RegisterPage] Registration response:', { status: response.status, result })

                if (!response.ok) {
                    throw new Error(result.message || result.msg || 'Registration failed')
                }


                setSubmitMessage(result.message || (editId ? 'Registration updated successfully' : 'User registered successfully'))
                resetForm()
                setEditId('')
                setExistingProfilePreview('')
                
                // Redirect to login page after successful registration
                if (!editId) {
                    setTimeout(() => {
                        window.location.href = '/login'
                    }, 2000)
                }
            } catch (error) {
                console.error('[RegisterPage] Registration error:', error)
                setSubmitError(error.message || 'Unable to register user')
            } finally {
                setIsSubmitting(false)
            }
        },
    })


    const startEdit = (item) => {
        setEditId(item._id)
        setSubmitMessage('')
        setSubmitError('')
        setFieldValue('fullName', item.fullName || item.fullname || '')
        setFieldValue('registerEmail', item.email || '')
        setFieldValue('mobile', item.mobile || '')
        setFieldValue('gender', item.gender || '')
        setFieldValue('address', item.address || '')
        setFieldValue('acceptTerms', true)
        setFieldValue('registerPassword', '')
        setFieldValue('confirmPassword', '')
        setFieldValue('profilePicture', null)
        const profileImage = item.profilePicture || item.profile_picture
        setExistingProfilePreview(profileImage ? `${apiBaseUrl}/uploads/profilePics/${profileImage}` : '')
    }


    const cancelEdit = () => {
        setEditId('')
        setExistingProfilePreview('')
        setSubmitMessage('')
        setSubmitError('')
        resetForm()
    }


    useEffect(() => {
        if (!values.profilePicture) {
            setProfilePreview('')
            return
        }


        const objectUrl = URL.createObjectURL(values.profilePicture)
        setProfilePreview(objectUrl)


        return () => {
            URL.revokeObjectURL(objectUrl)
        }
    }, [values.profilePicture])


    return (
        <section className="page-shell">
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm p-4 form-card">
                        <h2 className="mb-2">Register</h2>
                        <p className="page-intro mb-0">
                            Create your customer account to unlock loyalty rewards, exclusive promotions,
                            and smoother checkout for every purchase.
                        </p>
                        {editId && <div className="alert alert-info py-2">Edit mode is active. Update details and submit the form.</div>}
                        {submitMessage && <div className="col-12"><div className="alert alert-success mb-0">{submitMessage}</div></div>}
                        {submitError && <div className="col-12"><div className="alert alert-danger mb-0">{submitError}</div></div>}
                        <form className="row g-3 mt-1 form-grid" onSubmit={handleSubmit} noValidate>
                            <div className="col-12">
                                <label htmlFor="fullName" className="form-label">Full Name</label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    className={getInputClass('fullName')}
                                    value={values.fullName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName}</div>}
                            </div>


                            <div className="col-12 col-md-6">
                                <label htmlFor="mobile" className="form-label">Mobile Number</label>
                                <input
                                    id="mobile"
                                    name="mobile"
                                    type="text"
                                    className={getInputClass('mobile')}
                                    value={values.mobile}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
                            </div>


                            <div className="col-12 col-md-6">
                                <label htmlFor="gender" className="form-label">Gender</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    className={getInputClass('gender', 'form-select')}
                                    value={values.gender}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
                            </div>


                            <div className="col-12">
                                <label htmlFor="profilePicture" className="form-label">Profile Picture <span className="text-muted">(Optional)</span></label>
                                <input
                                    id="profilePicture"
                                    name="profilePicture"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className={getInputClass('profilePicture')}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.profilePicture && <div className="invalid-feedback d-block">{errors.profilePicture}</div>}
                                {(profilePreview || existingProfilePreview) && (
                                    <img
                                        src={profilePreview || existingProfilePreview}
                                        alt="Selected profile preview"
                                        className="img-thumbnail mt-2"
                                        style={{ maxWidth: '160px', maxHeight: '160px', objectFit: 'cover' }}
                                    />
                                )}
                            </div>


                            <div className="col-12">
                                <label htmlFor="address" className="form-label">Address</label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows="3"
                                    className={getInputClass('address')}
                                    value={values.address}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
                            </div>


                            <div className="col-12">
                                <label htmlFor="registerEmail" className="form-label">Email Address</label>
                                <input
                                    id="registerEmail"
                                    name="registerEmail"
                                    type="email"
                                    className={getInputClass('registerEmail')}
                                    value={values.registerEmail}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.registerEmail && <div className="invalid-feedback d-block">{errors.registerEmail}</div>}
                            </div>
                            {!editId && (
                                <>
                                    <div className="col-12 col-md-6">
                                        <label htmlFor="registerPassword" className="form-label">Password <span className="text-muted" style={{fontSize: '0.85em'}}>(minimum 8 characters)</span></label>
                                        <div className="password-inline-wrapper">
                                            <input
                                                id="registerPassword"
                                                name="registerPassword"
                                                type={showRegisterPassword ? 'text' : 'password'}
                                                className={getInputClass('registerPassword')}
                                                value={values.registerPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <button
                                                type="button"
                                                className="password-visibility-btn"
                                                aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                                                title={showRegisterPassword ? 'Hide password' : 'Show password'}
                                                onClick={() => setShowRegisterPassword((prev) => !prev)}
                                            >
                                                <i className={`bi bi-eye${showRegisterPassword ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                        {errors.registerPassword && <div className="invalid-feedback d-block">{errors.registerPassword}</div>}
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                        <div className="password-inline-wrapper">
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className={getInputClass('confirmPassword')}
                                                value={values.confirmPassword}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            />
                                            <button
                                                type="button"
                                                className="password-visibility-btn"
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            >
                                                <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                        {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                                    </div>
                                </>
                            )}
                            <div className="col-12">
                                <div className="form-check">
                                    <input
                                        id="acceptTerms"
                                        name="acceptTerms"
                                        type="checkbox"
                                        className={`form-check-input${errors.acceptTerms ? ' is-invalid' : ''}`}
                                        checked={values.acceptTerms}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    <label htmlFor="acceptTerms" className="form-check-label">I agree to the Terms of Service and Privacy Policy</label>
                                    {errors.acceptTerms && <div className="invalid-feedback d-block">{errors.acceptTerms}</div>}
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-dark w-100" disabled={isSubmitting}>
                                        {isSubmitting ? (editId ? 'Updating...' : 'Creating Account...') : (editId ? 'Update Account' : 'Create Account')}
                                    </button>
                                    {editId && (
                                        <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit} disabled={isSubmitting}>
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </div>


                            <div className="col-12 text-center">
                                <span className="text-muted">Already have an account? </span>
                                <Link to="/login">Login</Link>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </section>
    )
}


export default RegisterPage




