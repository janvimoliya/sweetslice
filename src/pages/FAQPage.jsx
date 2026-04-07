import CakeParticlesLayer from "../components/CakeParticlesLayer";
import { Link } from "react-router-dom";
import "../styles/PrivacyPage.css";

function FAQPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-header mb-4">
        <CakeParticlesLayer />
        <p className="service-kicker">Customer Service</p>
        <h2>Frequently Asked Questions</h2>
        <p className="text-muted">Quick answers for ordering, delivery, and support</p>
      </div>

      <div className="privacy-content-shell">
        <div className="service-intro-grid">
          <article className="service-intro-card">
            <span className="eyebrow">Ordering Help</span>
            <h3>How to shop smoothly</h3>
            <p>Find products, add them to cart, and complete checkout in a few quick steps.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Delivery Support</span>
            <h3>Clear shipping updates</h3>
            <p>See delivery coverage, timing, and simple guidance before you place your order.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Need Help Fast?</span>
            <h3>Contact our team anytime</h3>
            <p>We’re here to help with custom cakes, order questions, and post-order support.</p>
          </article>
        </div>

        <div className="privacy-content">
          <section className="policy-section policy-section--surface">
          <h4>How do I place an order?</h4>
          <p>Browse the shop, add cakes to your cart, then continue to checkout and confirm your delivery details.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>Can I customize my cake?</h4>
          <p>Yes. Use the customization note during checkout to share your flavor, design, or message preferences.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>Do you offer delivery?</h4>
          <p>We offer delivery for supported locations. Delivery options and charges are shown during checkout.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>What if I need help with an order?</h4>
          <p>Use the contact page and our team will help with order updates, delivery questions, or product support.</p>
        </section>

          <div className="service-support-cta">
            <h3>Still need help?</h3>
            <p>Send us a message and we’ll get back to you with the right answer for your order or delivery question.</p>
            <Link to="/contact">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQPage;
