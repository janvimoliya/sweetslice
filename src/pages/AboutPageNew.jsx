import "../styles/AboutPage.css"
import CakeParticlesLayer from "../components/CakeParticlesLayer"
import aboutBakeryGif from "../assets/about-bakery.gif"

function AboutPage() {
    return (
        <div className="about-page-wrapper">
            {/* Hero Section */}
            <section className="about-hero">
                <CakeParticlesLayer />
                <div className="about-hero-content">
                    <h1>About SweetSlice</h1>
                    <p className="hero-subtitle">Crafting happiness through the finest cakes since 2020</p>
                </div>
            </section>

            {/* Story Section */}
            <section className="story-section">
                <div className="container">
                    <div className="story-grid">
                        <div className="story-content">
                            <h2>Our Story</h2>
                            <p>
                                SweetSlice was born from a passion for baking and a desire to bring joy to special moments. 
                                What started as a small home bakery in 2020 has blossomed into a thriving business, trusted by 
                                hundreds of happy customers across the city.
                            </p>
                            <p>
                                Every cake we create is more than just dessert—it's a labor of love, crafted with premium ingredients, 
                                creative vision, and meticulous attention to detail. We believe that celebrations deserve treats as special 
                                as the moments they mark.
                            </p>
                            <p>
                                Today, we continue our journey with the same commitment: delivering exceptional cakes that not only taste 
                                incredible but also create lasting memories for our customers and their loved ones.
                            </p>

                            <div className="story-stats">
                                <div className="stat">
                                    <span className="stat-number">500+</span>
                                    <span className="stat-label">Happy Customers</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">1000+</span>
                                    <span className="stat-label">Cakes Baked</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">4.9/5</span>
                                    <span className="stat-label">Star Rating</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">6+</span>
                                    <span className="stat-label">Years Experience</span>
                                </div>
                            </div>
                        </div>
                        <div className="story-image">
                            <img src={aboutBakeryGif} alt="SweetSlice bakery cake" className="story-gif" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="why-choose-us">
                <div className="container">
                    <h2 className="section-title">Why Choose SweetSlice?</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🎂</div>
                            <h3>Premium Quality</h3>
                            <p>Hand-selected ingredients from trusted suppliers ensure every bite is a delight.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎨</div>
                            <h3>Custom Designs</h3>
                            <p>Our expert bakers create personalized designs tailored to your vision and preferences.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🚚</div>
                            <h3>Fast Delivery</h3>
                            <p>Fresh cakes delivered right to your door on time, ensuring peak freshness.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">👨‍🍳</div>
                            <h3>Expert Team</h3>
                            <p>Our experienced bakers bring creativity, skill, and passion to every creation.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💰</div>
                            <h3>Affordable</h3>
                            <p>Premium quality cakes at competitive prices that won't empty your wallet.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⭐</div>
                            <h3>Satisfaction Guaranteed</h3>
                            <p>99% customer satisfaction rate with stellar reviews and repeat customers.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="container">
                    <h2 className="section-title">Meet Our Team</h2>
                    <p className="section-subtitle">Passionate bakers and designers dedicated to excellence</p>
                    <div className="team-grid">
                        <div className="team-member">
                            <div className="member-image">👩‍🍳</div>
                            <h3>Sarah Johnson</h3>
                            <p className="role">Head Pastry Chef</p>
                            <p className="bio">10+ years of baking expertise. Specializes in custom cake designs and flavor innovation.</p>
                            <div className="social-icons">
                                <a href="#" className="social-icon">📘</a>
                                <a href="#" className="social-icon">📷</a>
                            </div>
                        </div>
                        <div className="team-member">
                            <div className="member-image">👨‍🍳</div>
                            <h3>Michael Chen</h3>
                            <p className="role">Master Baker</p>
                            <p className="bio">Classically trained baker with expertise in traditional and modern baking techniques.</p>
                            <div className="social-icons">
                                <a href="#" className="social-icon">📘</a>
                                <a href="#" className="social-icon">📷</a>
                            </div>
                        </div>
                        <div className="team-member">
                            <div className="member-image">👩‍🎨</div>
                            <h3>Emma Williams</h3>
                            <p className="role">Creative Designer</p>
                            <p className="bio">Artistic mind behind our beautiful cake designs mixing art and flavor perfectly.</p>
                            <div className="social-icons">
                                <a href="#" className="social-icon">📘</a>
                                <a href="#" className="social-icon">📷</a>
                            </div>
                        </div>
                        <div className="team-member">
                            <div className="member-image">👨‍💼</div>
                            <h3>David Martinez</h3>
                            <p className="role">Flavor Specialist</p>
                            <p className="bio">Curates unique flavor combinations and ensures consistent quality in every cake.</p>
                            <div className="social-icons">
                                <a href="#" className="social-icon">📘</a>
                                <a href="#" className="social-icon">📷</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <h2 className="section-title">Our Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <h3>🌟 Excellence</h3>
                            <p>We strive for perfection in every cake, from flavor to design.</p>
                        </div>
                        <div className="value-card">
                            <h3>❤️ Passion</h3>
                            <p>We pour our hearts into every creation with genuine care and dedication.</p>
                        </div>
                        <div className="value-card">
                            <h3>🤝 Trust</h3>
                            <p>Building lasting relationships with our customers through quality and reliability.</p>
                        </div>
                        <div className="value-card">
                            <h3>🌱 Sustainability</h3>
                            <p>Committed to using eco-friendly practices and sustainable packaging.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call To Action Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Experience SweetSlice?</h2>
                    <p>Order your favorite cake today and taste the difference quality makes.</p>
                    <div className="cta-buttons">
                        <a href="/shop" className="cta-btn primary">Shop Now</a>
                        <a href="/contact" className="cta-btn secondary">Get In Touch</a>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AboutPage
