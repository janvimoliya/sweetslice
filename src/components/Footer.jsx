import '../styles/Footer.css'
import { Link } from 'react-router-dom'

function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer-modern">
            {/* Newsletter Section */}
            <div className="newsletter-section">
                <div className="newsletter-container">
                    <div className="newsletter-content">
                        <h3>Get 20% Off Your First Order</h3>
                        <p>Subscribe to our newsletter and receive exclusive offers, new arrivals, and baking tips.</p>
                    </div>
                    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                        <input 
                            type="email" 
                            placeholder="Enter your email address"
                            required
                        />
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
            </div>

            {/* Main Footer */}
            <div className="footer-main">
                <div className="footer-container">
                    {/* Brand Section */}
                    <div className="footer-section brand-section">
                        <div className="footer-brand">
                            <span className="footer-logo">🍰</span>
                            <h4>SweetSlice</h4>
                        </div>
                        <p className="brand-description">
                            Handcrafted cakes made with love and the finest ingredients. Delivering happiness one slice at a time.
                        </p>
                        <div className="social-links">
                            <a href="#facebook" className="social-link" title="Facebook">
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a href="#instagram" className="social-link" title="Instagram">
                                <i className="bi bi-instagram"></i>
                            </a>
                            <a href="#twitter" className="social-link" title="Twitter">
                                <i className="bi bi-twitter"></i>
                            </a>
                            <a href="#pinterest" className="social-link" title="Pinterest">
                                <i className="bi bi-pinterest"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h5 className="footer-title">Quick Links</h5>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/shop">Shop All Cakes</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/cart">Cart</Link></li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div className="footer-section">
                        <h5 className="footer-title">Categories</h5>
                        <ul className="footer-links">
                            <li><a href="#chocolate">Chocolate Cakes</a></li>
                            <li><a href="#vanilla">Vanilla Cakes</a></li>
                            <li><a href="#fruit">Fruit Cakes</a></li>
                            <li><a href="#special">Special Occasions</a></li>
                            <li><a href="#custom">Custom Orders</a></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="footer-section">
                        <h5 className="footer-title">Customer Service</h5>
                        <ul className="footer-links">
                            <li><Link to="/faq">FAQ</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms & Conditions</Link></li>
                            <li><Link to="/shipping">Shipping Info</Link></li>
                            <li><Link to="/returns">Returns & Refunds</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h5 className="footer-title">Get In Touch</h5>
                        <div className="contact-items">
                            <div className="contact-item">
                                <i className="bi bi-telephone"></i>
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="contact-item">
                                <i className="bi bi-envelope"></i>
                                <span>hello@sweetslice.com</span>
                            </div>
                            <div className="contact-item">
                                <i className="bi bi-geo-alt"></i>
                                <span>123 Bakery Lane, Sweet City, SC 12345</span>
                            </div>
                            <div className="contact-item">
                                <i className="bi bi-clock"></i>
                                <span>Mon-Sun: 9:00 AM - 10:00 PM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="footer-divider"></div>

                {/* Bottom Footer */}
                <div className="footer-bottom">
                    <p className="copyright">
                        &copy; {currentYear} SweetSlice. All rights reserved. Made with <span className="heart">❤️</span>
                    </p>
                    
                </div>
            </div>
        </footer>
    )
}

export default Footer
