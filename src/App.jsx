import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './styles/Global.css'
import { Route, Routes, BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'
import CommonLayout from './components/CommonLayout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ContactPage from './pages/ContactPage'
import ShopPage from './pages/ShopPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import WishlistPage from './pages/WishlistPage'
import ProfilePage from './pages/ProfilePage'
import AboutPage from './pages/AboutPageNew'
import PrivacyPage from './pages/PrivacyPage'
import FAQPage from './pages/FAQPage'
import TermsPage from './pages/TermsPage'
import ShippingInfoPage from './pages/ShippingInfoPage'
import ReturnsPage from './pages/ReturnsPage'
import OffersPage from './pages/OffersPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPanelPage from './pages/AdminPanelPage'
import AdminProfilePage from './pages/AdminProfilePage'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken')

  if (!adminToken) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function UserProtectedRoute({ children }) {
  const userToken = localStorage.getItem('userToken')
  const userId = localStorage.getItem('userId')

  if (!userToken && !userId) {
    return <Navigate to="/login" replace />
  }

  return children
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function AppRouterContent({ theme, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [effectiveLocation, setEffectiveLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: null,
    key: 'window-initial',
  }))
  const routerPathRef = useRef('')

  const currentRouterPath = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.pathname, location.search, location.hash],
  )

  useEffect(() => {
    routerPathRef.current = currentRouterPath
  }, [currentRouterPath])

  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    const readWindowLocation = () => ({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      state: null,
      key: `window-${Date.now()}`,
    })

    const syncFromWindow = () => {
      const nextWindowPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      setEffectiveLocation(readWindowLocation())

      if (nextWindowPath !== routerPathRef.current) {
        navigate(nextWindowPath, { replace: true })
      }
    }

    window.history.pushState = function patchedPushState(...args) {
      const result = originalPushState(...args)
      window.dispatchEvent(new Event('locationchange'))
      return result
    }

    window.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState(...args)
      window.dispatchEvent(new Event('locationchange'))
      return result
    }

    syncFromWindow()
    window.addEventListener('locationchange', syncFromWindow)
    window.addEventListener('popstate', syncFromWindow)
    window.addEventListener('hashchange', syncFromWindow)
    const syncInterval = window.setInterval(syncFromWindow, 350)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener('locationchange', syncFromWindow)
      window.removeEventListener('popstate', syncFromWindow)
      window.removeEventListener('hashchange', syncFromWindow)
      window.clearInterval(syncInterval)
    }
  }, [navigate])

  return (
    <CommonLayout theme={theme} onToggleTheme={onToggleTheme}>
      <Routes
        location={effectiveLocation}
        key={`${effectiveLocation.pathname}${effectiveLocation.search}${effectiveLocation.hash}`}
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route
          path="/profile"
          element={
            <UserProtectedRoute>
              <ProfilePage />
            </UserProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/shipping" element={<ShippingInfoPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/panel"
          element={
            <AdminProtectedRoute>
              <AdminPanelPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminProtectedRoute>
              <AdminProfilePage />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </CommonLayout>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('siteTheme')

    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('siteTheme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <ScrollToTopOnRouteChange />
          <AppRouterContent theme={theme} onToggleTheme={handleToggleTheme} />
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  )
}

export default App
