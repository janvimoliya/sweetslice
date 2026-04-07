import CakeParticlesLayer from "../components/CakeParticlesLayer";
import { Link } from "react-router-dom";
import "../styles/PrivacyPage.css";

function TermsPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-header mb-4">
        <CakeParticlesLayer />
        <p className="service-kicker">Customer Service</p>
        <h2>Terms & Conditions</h2>
        <p className="text-muted">Please review the rules that apply when using SweetSlice</p>
      </div>

      <div className="privacy-content-shell">
        <div className="service-intro-grid">
          <article className="service-intro-card">
            <span className="eyebrow">Clear Rules</span>
            <h3>Simple terms, no confusion</h3>
            <p>We keep our terms readable so customers can order with confidence and clarity.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Safe Ordering</span>
            <h3>Trusted checkout process</h3>
            <p>Review pricing, availability, and account details before completing your order.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Need Help?</span>
            <h3>We’ll guide you</h3>
            <p>If something is unclear, use our contact page and we’ll clarify it for you.</p>
          </article>
        </div>

        <div className="privacy-content">
          <section className="policy-section policy-section--surface">
          <h4>1. Acceptance of Terms</h4>
          <p>By using this website, you agree to follow these terms and all applicable policies listed on our site.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>2. Orders and Payments</h4>
          <p>All orders are subject to product availability, pricing accuracy, and successful payment authorization where required.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>3. Product Information</h4>
          <p>We try to keep product details accurate, but small differences in design, color, or decoration may occur.</p>
        </section>

          <section className="policy-section policy-section--surface">
          <h4>4. User Responsibilities</h4>
          <p>You are responsible for keeping account details accurate and for reviewing your order information before checkout.</p>
          <div className="service-pill-list">
            <span className="service-pill">Account accuracy</span>
            <span className="service-pill">Order review</span>
            <span className="service-pill">Payment confirmation</span>
          </div>
        </section>

          <div className="service-support-cta">
            <h3>Questions about these terms?</h3>
            <p>Reach out to our support team if you need help understanding any policy before you order.</p>
            <Link to="/contact">Ask a Question</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
