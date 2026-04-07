import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rules, useFormValidation } from '../validation/formValidation';
import '../styles/AdminLoginPage.css';

function AdminLoginPage() {
  const apiBaseUrl = 'http://localhost:5000';
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationRules = {
    adminId: [
      rules.required('Admin ID is required'),
      rules.minLength(3),
      (value) => {
        if (!value) return '';
        return /^[a-zA-Z0-9_.-]+$/.test(String(value).trim())
          ? ''
          : 'Admin ID can contain letters, numbers, dot, underscore and hyphen only';
      },
    ],
    password: [rules.required('Password is required'), rules.minLength(8)],
  };

  const { values, errors, handleChange, handleBlur, handleSubmit, getInputClass } = useFormValidation({
    initialValues: {
      adminId: '',
      password: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      setIsSubmitting(true);
      setSubmitError('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminId: String(formValues.adminId || '').trim(),
            password: formValues.password,
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.message || 'Admin login failed');
        }

        localStorage.setItem('adminToken', result?.data?.token || '');
        localStorage.setItem('adminId', result?.data?.adminId || formValues.adminId);

        navigate('/admin/panel');
      } catch (error) {
        setSubmitError(error.message || 'Admin login failed');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <section className="admin-login-page">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        

        {submitError && <div className="alert alert-danger">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="adminId" className="form-label">Admin ID</label>
            <input
              id="adminId"
              name="adminId"
              type="text"
              className={getInputClass('adminId')}
              value={values.adminId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter admin ID"
            />
            {errors.adminId && <div className="invalid-feedback d-block">{errors.adminId}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={getInputClass('password')}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter password"
            />
            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-danger w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminLoginPage;
