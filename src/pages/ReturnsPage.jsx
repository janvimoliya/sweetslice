import CakeParticlesLayer from "../components/CakeParticlesLayer";
import { Link } from "react-router-dom";
import "../styles/PrivacyPage.css";

function ReturnsPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-header mb-4">
        <CakeParticlesLayer />
        <p className="service-kicker">Customer Service</p>
        <h2>Returns & Refunds</h2>
        <p className="text-muted">Help with damaged, incorrect, or undelivered orders</p>
      </div>

      <div className="privacy-content-shell">
        <div className="service-intro-grid">
          <article className="service-intro-card">
            <span className="eyebrow">Quick Review</span>
            <h3>We inspect every concern</h3>
            <p>Share your order details and photos so our team can review the issue quickly.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Fair Support</span>
            <h3>Clear next steps</h3>
            <p>We’ll guide you through refund or replacement options based on the issue.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Fast Contact</span>
            <h3>Report issues early</h3>
            <p>Reach out as soon as possible for the smoothest resolution.</p>
          </article>
        </div>

        <div className="privacy-content">
        <section className="policy-section policy-section--surface">
          <h4>Return Eligibility</h4>
          <p>Because cakes are perishable, returns are limited. Please contact us as soon as possible if your order is damaged or incorrect.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>Refund Process</h4>
          <p>Approved refunds are handled according to the original payment method or store credit, depending on the situation.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>How to Request Help</h4>
          <p>Use the contact page with your order number, issue description, and photos if applicable so we can investigate quickly.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>Resolution Goal</h4>
          <p>We aim to resolve issues fairly and quickly, keeping your experience smooth and trustworthy.</p>
        </section>

        <div className="service-support-cta">
          <h3>Start a support request</h3>
          <p>If your order arrived damaged or incorrect, contact us right away and we’ll help you resolve it.</p>
          <Link to="/contact">Report an Issue</Link>
        </div>
        </div>
      </div>
    </div>
  );
}

export default ReturnsPage;
