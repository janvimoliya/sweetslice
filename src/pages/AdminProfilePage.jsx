import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rules, useFormValidation } from '../validation/formValidation';
import '../styles/AdminProfilePage.css';
import CakeParticlesLayer from '../components/CakeParticlesLayer';

function AdminProfilePage() {
  const apiBaseUrl = 'http://localhost:5000';
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');
  const fallbackAdminId = localStorage.getItem('adminId') || 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);

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
    currentPassword: [rules.required('Current password is required'), rules.minLength(8)],
    newPassword: [
      rules.minLength(8),
      (value) => {
        if (!value) return '';
        return String(value).length <= 50 ? '' : 'New password cannot exceed 50 characters';
      },
    ],
    confirmPassword: [
      (value, formValues) => {
        if (!formValues.newPassword) return '';
        if (!value) return 'Please confirm new password';
        return value === formValues.newPassword ? '' : 'Passwords do not match';
      },
    ],
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    getInputClass,
  } = useFormValidation({
    initialValues: {
      adminId: fallbackAdminId,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      try {
        const payload = {
          adminId: formValues.adminId.trim(),
          currentPassword: formValues.currentPassword,
        };

        if (formValues.newPassword) {
          payload.newPassword = formValues.newPassword;
        }

        const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          const combinedErrors = Array.isArray(result.errors) ? result.errors.join(', ') : '';
          throw new Error(combinedErrors || result.message || 'Failed to update admin profile');
        }

        const nextAdminId = result?.data?.adminId || formValues.adminId.trim();
        const nextToken = result?.data?.token || adminToken;

        localStorage.setItem('adminId', nextAdminId);
        localStorage.setItem('adminToken', nextToken);

        setProfile((prev) => ({
          ...(prev || {}),
          adminId: nextAdminId,
        }));

        setFieldValue('currentPassword', '');
        setFieldValue('newPassword', '');
        setFieldValue('confirmPassword', '');
        setMessage('Admin profile updated successfully');
      } catch (submitError) {
        setError(submitError.message || 'Failed to update admin profile');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    }),
    [adminToken]
  );

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    const loadAdminProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/profile`, {
          headers: authHeaders,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load admin profile');
        }

        setProfile(result.data || null);
        setFieldValue('adminId', result?.data?.adminId || fallbackAdminId);
      } catch (profileError) {
        setError(profileError.message || 'Failed to load admin profile');
      } finally {
        setLoading(false);
      }
    };

    loadAdminProfile();
  }, [adminToken, apiBaseUrl, authHeaders, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    navigate('/admin/login');
  };

  const toDisplayDate = (value) => {
    if (!value) return '-';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleString();
  };

  return (
    <section className="admin-profile-page">
      <div className="admin-profile-header">
        <CakeParticlesLayer />
        <h2>Admin Profile</h2>
        <div className="admin-profile-actions">
          <button type="button" className="btn btn-outline-dark" onClick={() => navigate('/admin/panel')}>
            Back to Dashboard
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="admin-profile-card">
        {loading ? (
          <p>Loading admin profile...</p>
        ) : (
          <form className="admin-profile-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-profile-field">
              <label htmlFor="adminId" className="form-label">Admin ID</label>
              <input
                id="adminId"
                name="adminId"
                className={getInputClass('adminId')}
                value={values.adminId}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.adminId && <div className="invalid-feedback d-block">{errors.adminId}</div>}
            </div>

            <div className="admin-profile-field">
              <label htmlFor="role" className="form-label">Role</label>
              <input id="role" className="form-control role-input" value={(profile?.role || 'admin').toUpperCase()} readOnly />
            </div>

            <div className="admin-profile-field">
              <label htmlFor="currentPassword" className="form-label">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className={getInputClass('currentPassword')}
                value={values.currentPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter current password"
              />
              {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
            </div>

            <div className="admin-profile-field">
              <label htmlFor="newPassword" className="form-label">New Password (Optional)</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className={getInputClass('newPassword')}
                value={values.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter new password"
              />
              {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
            </div>

            <div className="admin-profile-field">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={getInputClass('confirmPassword')}
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
            </div>

            <div className="admin-profile-field">
              <label htmlFor="loggedInAt" className="form-label">Logged In At</label>
              <input id="loggedInAt" className="form-control" value={toDisplayDate(profile?.loggedInAt)} readOnly />
            </div>

            <div className="admin-profile-field">
              <label htmlFor="tokenExpiresAt" className="form-label">Token Expires</label>
              <input id="tokenExpiresAt" className="form-control" value={toDisplayDate(profile?.tokenExpiresAt)} readOnly />
            </div>

            <div className="admin-profile-submit-wrap">
              <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default AdminProfilePage;
