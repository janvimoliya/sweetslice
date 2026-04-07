import "../styles/AboutPage.css";
import aboutBakeryGif from "../assets/about-bakery.gif";

function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-header mb-5">
        <h2>About SweetSlice</h2>
        <p className="lead">
          Bringing joy, one delicious cake at a time since 2020
        </p>
      </div>

      <div className="row mb-5">
        <div className="col-lg-6 mb-4">
          <h3>Our Story</h3>
          <p>
            SweetSlice was founded with a simple mission: to create the most
            delicious, beautifully crafted cakes that bring joy to every
            celebration. What started as a small home bakery has grown into a
            beloved destination for premium cakes and pastries.
          </p>
          <p>
            Every cake we create is made with the finest ingredients, passion,
            and attention to detail. We believe that special moments deserve
            special treats, and we're here to make your celebrations unforgettable.
          </p>
        </div>

        <div className="col-lg-6 mb-4">
          <img
            src={aboutBakeryGif}
            alt="Our Bakery"
            className="img-fluid rounded"
          />
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="why-choose-us mb-5">
        <h3 className="mb-4">Why Choose SweetSlice?</h3>
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">🎂</div>
              <h5>Premium Quality</h5>
              <p>We use only the finest ingredients sourced from trusted suppliers</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h5>Custom Designs</h5>
              <p>Our expert bakers create custom designs tailored to your vision</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h5>Fast Delivery</h5>
              <p>We deliver fresh cakes right to your door, on time, every time</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">👨‍🍳</div>
              <h5>Expert Bakers</h5>
              <p>Our team of experienced bakers brings creativity and skill</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h5>Affordable Prices</h5>
              <p>Premium quality cakes at prices that won't break the bank</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h5>Customer Satisfaction</h5>
              <p>99% customer satisfaction rate with excellent reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="team-section">
        <h3 className="mb-4">Our Team</h3>
        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/150x150?text=Chef+1"
                alt="Chef"
                className="img-fluid rounded-circle"
              />
              <h5 className="mt-3">Sarah Johnson</h5>
              <p className="text-muted">Head Pastry Chef</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/150x150?text=Chef+2"
                alt="Chef"
                className="img-fluid rounded-circle"
              />
              <h5 className="mt-3">Michael Chen</h5>
              <p className="text-muted">Master Baker</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/150x150?text=Chef+3"
                alt="Chef"
                className="img-fluid rounded-circle"
              />
              <h5 className="mt-3">Emma Williams</h5>
              <p className="text-muted">Cake Designer</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="team-member">
              <img
                src="https://via.placeholder.com/150x150?text=Chef+4"
                alt="Chef"
                className="img-fluid rounded-circle"
              />
              <h5 className="mt-3">David Martinez</h5>
              <p className="text-muted">Flavor Specialist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
