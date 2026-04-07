import { Link } from "react-router-dom";
import CakeParticlesLayer from "../components/CakeParticlesLayer";
import "../styles/PrivacyPage.css";

function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-header mb-4">
        <CakeParticlesLayer />
        <p className="service-kicker">Customer Service</p>
        <h2>Privacy Policy</h2>
        <p className="text-muted">Last Updated: March 2026</p>
      </div>

      <div className="privacy-content-shell">
        <div className="service-intro-grid">
          <article className="service-intro-card">
            <span className="eyebrow">Data Protection</span>
            <h3>Your information matters</h3>
            <p>
              We protect customer data with secure handling, controlled access,
              and privacy-first practices.
            </p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Transparency</span>
            <h3>Clear policy language</h3>
            <p>
              This page explains what we collect, how we use it, and the choices
              you have as a customer.
            </p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Support Access</span>
            <h3>Need clarification?</h3>
            <p>
              Our support team can help if you have concerns about data usage,
              deletion, or account details.
            </p>
          </article>
        </div>

        <div className="privacy-content">
          <section className="policy-section policy-section--surface">
            <h4>1. Introduction</h4>
            <p>
              Welcome to SweetSlice ("we," "our," or "us"). We are committed to
              protecting your privacy and ensuring you have a positive
              experience on our website. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              visit our website and use our services.
            </p>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>2. Information We Collect</h4>
            <p>We may collect information about you in a variety of ways:</p>
            <ul>
              <li>
                <strong>Personal Data:</strong> When you register, place an
                order, or contact us, we may collect your name, email address,
                phone number, shipping address, and payment information.
              </li>
              <li>
                <strong>Automatically Collected Data:</strong> We automatically
                collect certain information about your device when you access
                our website, including IP address, browser type, and browsing
                history.
              </li>
              <li>
                <strong>Cookies and Tracking:</strong> We use cookies and
                similar tracking technologies to enhance your experience and
                understand how you use our site.
              </li>
            </ul>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>3. How We Use Your Information</h4>
            <p>We use the information we collect for various purposes:</p>
            <ul>
              <li>To process your orders and deliver products/services</li>
              <li>To communicate with you about your account and orders</li>
              <li>To improve our website and services</li>
              <li>To send you promotional emails and updates (with consent)</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and enhance security</li>
            </ul>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>4. Information Sharing</h4>
            <p>
              We do not sell, trade, or rent your personal information to third
              parties. However, we may share your information with:
            </p>
            <ul>
              <li>Service providers who assist us in operating our website</li>
              <li>Payment processors to handle transactions</li>
              <li>Shipping partners to deliver your orders</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>5. Data Security</h4>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>6. Your Rights</h4>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>7. Cookies Policy</h4>
            <p>
              Our website uses cookies to enhance your experience. You can
              control cookie settings through your browser preferences.
              Disabling cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>8. Third-Party Links</h4>
            <p>
              Our website may contain links to third-party websites. We are not
              responsible for the privacy practices of external sites. We
              encourage you to review their privacy policies.
            </p>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>9. Children's Privacy</h4>
            <p>
              Our website is not intended for children under 13 years of age.
              We do not knowingly collect personal information from children.
              If we become aware of such collection, we will take steps to
              delete the information.
            </p>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>10. Contact Us</h4>
            <p>
              If you have questions about this Privacy Policy or our privacy
              practices, please contact us:
            </p>
            <ul>
              <li>Email: privacy@sweetslice.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Baker Street, Cake City, CC 12345</li>
            </ul>
          </section>

          <section className="policy-section policy-section--surface">
            <h4>11. Changes to This Policy</h4>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any significant changes by updating the "Last
              Updated" date at the top of this page.
            </p>
          </section>

          <div className="service-support-cta">
            <h3>Questions about your privacy?</h3>
            <p>
              Contact us if you want to request updates, deletion, or
              clarification about how your data is handled.
            </p>
            <Link to="/contact">Contact Privacy Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
