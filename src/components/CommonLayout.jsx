import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useWishlist } from '../hooks/useWishlist'
import Footer from './Footer'


function CommonLayout({ children, theme, onToggleTheme }) {
    const { pathname, search } = useLocation()
    const navigate = useNavigate()
    const { getCartItemsCount } = useCart()
    const { wishlist } = useWishlist()
    const cartCount = getCartItemsCount()
    const wishlistCount = wishlist.length
    const isUserLoggedIn = Boolean(localStorage.getItem('userToken') || localStorage.getItem('userId'))
    const headerSearchTerm = pathname === '/shop' ? (new URLSearchParams(search).get('search') || '') : ''
    const isAdminPanelRoute = pathname === '/admin/panel' || pathname === '/admin/profile'
    const isAdminRoute = pathname.startsWith('/admin')

    const handleUserLogout = () => {
        localStorage.removeItem('userToken')
        localStorage.removeItem('userId')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        localStorage.removeItem('userProfile')
        window.dispatchEvent(new Event('auth-changed'))
        navigate('/login')
    }

    const menuItems = [
        { label: 'Home', path: '/' },
        { label: 'Shop', path: '/shop' },
        { label: 'Offers', path: '/offers' },
        { label: 'Profile', path: '/profile' },
        { label: 'About', path: '/about' },
        { label: 'Contact', path: '/contact' },
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' },
        // { label: 'Admin Login', path: '/admin/login' },
       // { label: 'Admin Panel', path: '/admin/panel' },
    ]

    const routeSubtitles = {
        '/': 'Discover trending products, best deals, and new arrivals.',
        '/shop': 'Browse our delicious collection of freshly baked cakes.',
        '/offers': 'Don\'t miss our limited-time exclusive promotions and special deals.',
        '/cart': 'Review your items and proceed to checkout.',
        '/wishlist': 'Save your favorite cakes for later.',
        '/profile': 'Manage your account and view your orders.',
        '/order-success': 'Your order is confirmed and ready for tracking.',
        '/register': 'Create your account for faster checkout and rewards.',
        '/contact': 'Get in touch with our customer support team.',
        '/about': 'Learn about our story and commitment to quality.',
        '/faq': 'Find quick answers to common customer questions.',
        '/terms': 'Read the terms that govern your use of SweetSlice.',
        '/shipping': 'Understand how we prepare and deliver your orders.',
        '/returns': 'Learn about returns, refunds, and order support.',
        '/privacy': 'Your privacy and security matters to us.',
    }

    const currentSubtitle =
        routeSubtitles[pathname] ||
        (pathname.startsWith('/order-success/')
            ? routeSubtitles['/order-success']
            : 'Explore our ecommerce experience and services.')

    const handleHeaderSearchSubmit = (event) => {
        event.preventDefault()
        const searchInput = event.currentTarget.elements.namedItem('headerSearch')
        const trimmedSearchTerm = (searchInput?.value || '').trim()

        if (!trimmedSearchTerm) {
            navigate('/shop')
            return
        }

        navigate(`/shop?search=${encodeURIComponent(trimmedSearchTerm)}`)
    }

    return (
        <div className="common-layout">
            {!isAdminPanelRoute && (
            <header className="site-header">
                {/* <div className="top-strip">
                    <div className="container-fluid top-strip-inner">
                        <span>Fresh bakes delivered in 90 minutes in selected cities</span>
                        <span>Order support: support@sweetslice.com</span>
                    </div>
                </div> */}

                <div className="header-top">
                    <div className="container-fluid header-top-inner">
                        <div className="site-title-wrap">
                            <h1 className="site-title m-0">SweetSlice</h1>
                            <p className="site-subtitle m-0">{currentSubtitle}</p>
                        </div>

                        <form className="header-search-wrap" onSubmit={handleHeaderSearchSubmit} role="search" aria-label="Search products">
                            <button type="submit" className="header-search-submit" aria-label="Search">
                                <i className="bi bi-search" aria-hidden="true"></i>
                            </button>
                            <input
                                name="headerSearch"
                                type="search"
                                placeholder="Search cakes"
                                aria-label="Search cakes"
                                defaultValue={headerSearchTerm}
                                key={`${pathname}:${headerSearchTerm}`}
                            />
                        </form>

                        <div className="header-quick-actions" aria-label="Quick actions">
                            <div className="support-block">
                                <i className="bi bi-telephone-forward" aria-hidden="true"></i>
                                <div>
                                    <small>24 / 7 Support Center</small>
                                    <strong>+91 8588813880</strong>
                                </div>
                            </div>

                            <NavLink to="/profile" className="icon-action" title="Profile" aria-label="Profile">
                                <span className="material-symbols-outlined" aria-hidden="true">person</span>
                            </NavLink>
                            <NavLink to="/wishlist" className="icon-action" title="Wishlist" aria-label="Wishlist">
                                <span className="material-symbols-outlined" aria-hidden="true">favorite</span>
                                {isUserLoggedIn && wishlistCount > 0 && <span className="header-badge">{wishlistCount}</span>}
                            </NavLink>
                            <NavLink to="/cart" className="icon-action" title="Cart" aria-label="Cart">
                                <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
                                {isUserLoggedIn && cartCount > 0 && <span className="header-badge">{cartCount}</span>}
                            </NavLink>

                            {isUserLoggedIn && (
                                <button
                                    type="button"
                                    className="icon-action logout-action"
                                    title="Logout"
                                    aria-label="Logout"
                                    onClick={handleUserLogout}
                                >
                                    <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="category-nav" aria-label="Main navigation">
                    <div className="container-fluid">
                        <ul className="category-list">
                            {menuItems.map((item) => (
                                <li key={item.path} className="category-item">
                                    <NavLink
                                        to={item.path}
                                        end={item.path === '/'}
                                        className={({ isActive }) =>
                                            isActive ? 'category-link category-link-active' : 'category-link'
                                        }
                                    >
                                        {item.label}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="brand-ribbon">
                    <Link to="/shop" className="ribbon-action">Explore Fresh Cakes</Link>
                    <span>Handcrafted daily with premium ingredients</span>
                </div>
            </header>
            )}

            <main className="site-main">{children}</main>

            <button
                type="button"
                className="global-theme-toggle"
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
                <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} aria-hidden="true"></i>
            </button>

            {!isAdminRoute && <Footer />}
        </div>
    )
}

export default CommonLayout









