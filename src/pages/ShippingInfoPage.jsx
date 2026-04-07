import CakeParticlesLayer from "../components/CakeParticlesLayer";
import { Link } from "react-router-dom";
import "../styles/PrivacyPage.css";

function ShippingInfoPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-header mb-4">
        <CakeParticlesLayer />
        <p className="service-kicker">Customer Service</p>
        <h2>Shipping Info</h2>
        <p className="text-muted">How we prepare, pack, and deliver your cakes</p>
      </div>

      <div className="privacy-content-shell">
        <div className="service-intro-grid">
          <article className="service-intro-card">
            <span className="eyebrow">Fast Dispatch</span>
            <h3>Prepared with care</h3>
            <p>We bake and pack your order to keep it fresh before delivery.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Reliable Delivery</span>
            <h3>Clear timing updates</h3>
            <p>Delivery details are shown in checkout so you can plan confidently.</p>
          </article>
          <article className="service-intro-card">
            <span className="eyebrow">Good Packaging</span>
            <h3>Protected in transit</h3>
            <p>We focus on safe handling so your cake arrives looking beautiful.</p>
          </article>
        </div>

        <div className="privacy-content">
        <section className="policy-section policy-section--surface">
          <h4>Delivery Coverage</h4>
          <p>We deliver to supported service areas shown during checkout. If your area is unavailable, please contact us before ordering.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>Processing Time</h4>
          <p>Most orders are prepared within the estimated time shown on the product or checkout page, depending on customization and stock.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>Shipping Charges</h4>
          <p>Shipping charges, if any, are calculated at checkout. Some eligible orders may qualify for free delivery.</p>
        </section>

        <section className="policy-section policy-section--surface">
          <h4>Delivery Notes</h4>
          <p>Please provide accurate address and phone details so our delivery team can reach you without delay.</p>
        </section>

        <div className="service-support-cta">
          <h3>Need shipping help?</h3>
          <p>Contact us if you’re unsure about delivery coverage, timelines, or special handling before ordering.</p>
          <Link to="/contact">Contact Support</Link>
        </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingInfoPage;
