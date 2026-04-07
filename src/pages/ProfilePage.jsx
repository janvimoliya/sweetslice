import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { rules, useFormValidation } from "../validation/formValidation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CakeParticlesLayer from "../components/CakeParticlesLayer";
import "../styles/ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = "http://localhost:5000";
  const [userProfile, setUserProfile] = useState(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [recentOrders, setRecentOrders] = useState([])
  const [orderStats, setOrderStats] = useState({ total: 0, delivered: 0, spent: 0 })
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState("")
  const [ordersLastSyncedAt, setOrdersLastSyncedAt] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState(() => (
    new URLSearchParams(location.search).get("tab") === "orders" ? "orders" : "profile"
  ))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [profilePreview, setProfilePreview] = useState("")
  const [selectedProfileFile, setSelectedProfileFile] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState("")
  const lastHydratedProfileKeyRef = useRef("")

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return "";
    if (profilePicture.startsWith("http") || profilePicture.startsWith("data:")) {
      return profilePicture;
    }
    if (profilePicture.startsWith("/uploads/")) {
      return `${apiBaseUrl}${profilePicture}`;
    }
    return `${apiBaseUrl}/uploads/profilePics/${profilePicture}`;
  };

  // Check if user is logged in
  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");
    if (!userToken && !userId) {
      navigate("/login");
    }
  }, [navigate]);

  // Load user profile from database
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail") || "";

    if (!userId) {
      setUserProfile({
        fullName: "",
        email: userEmail,
        mobile: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        profilePicture: "",
      });
      return;
    }

    const loadProfileFromDb = async () => {
      try {
        const userToken = localStorage.getItem("userToken");
        const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
          headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Failed to load profile");
        }

        const profileData = result?.data || {};
        setUserProfile(profileData);
        setProfilePreview(getProfilePictureUrl(profileData.profilePicture));
        localStorage.setItem("userProfile", JSON.stringify(profileData));
      } catch {
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
          setProfilePreview(getProfilePictureUrl(profile.profilePicture || profile.profileImage));
        } else {
          setUserProfile({
            fullName: "",
            email: userEmail,
            mobile: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
            profilePicture: "",
          });
        }
      }
    };

    loadProfileFromDb();
  }, [apiBaseUrl]);

  useEffect(() => {
    try {
      const userId = localStorage.getItem("userId");
      const storageKey = userId ? `wishlist_${userId}` : "wishlist_guest";
      const storedWishlist = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setWishlistCount(Array.isArray(storedWishlist) ? storedWishlist.length : 0);
    } catch {
      setWishlistCount(0);
    }
  }, []);

  const loadUserOrders = useCallback(async (userId) => {
    if (!userId) return;

    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/user/${userId}`);

      if (response.status === 404) {
        setRecentOrders([]);
        setOrderStats({ total: 0, delivered: 0, spent: 0 });
        setOrdersLastSyncedAt(new Date().toLocaleTimeString());
        return;
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch orders");
      }

      const orders = Array.isArray(result?.data) ? result.data : [];
      const deliveredOrders = orders.filter(
        (order) => String(order?.status || "").toLowerCase() === "delivered",
      ).length;
      const totalSpent = orders.reduce(
        (sum, order) => sum + Number(order?.totalAmount || 0),
        0,
      );

      setOrderStats({
        total: orders.length,
        delivered: deliveredOrders,
        spent: totalSpent,
      });
      setRecentOrders(orders.slice(0, 5));
      setOrdersLastSyncedAt(new Date().toLocaleTimeString());
    } catch (error) {
      setOrdersError(error.message || "Unable to load recent orders");
      setOrderStats({ total: 0, delivered: 0, spent: 0 });
    } finally {
      setOrdersLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    let isCancelled = false;

    const refreshOrders = async () => {
      if (isCancelled) return;
      await loadUserOrders(userId);
    };

    refreshOrders();

    const refreshInterval = window.setInterval(() => {
      refreshOrders();
    }, 30000);

    return () => {
      isCancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [loadUserOrders]);

  const validationRules = {
    fullName: [
      rules.required("Full name is required"),
      rules.alphabetic(),
      rules.minLength(3),
    ],
    email: [rules.required("Email is required"), rules.email()],
    mobile: [
      rules.required("Mobile is required"),
      rules.numeric(),
      rules.minLength(10),
      rules.maxLength(15),
    ],
    address: [
      rules.required("Address is required"),
      rules.minLength(10),
      rules.maxLength(250),
    ],
    city: [rules.required("City is required")],
    state: [rules.required("State is required")],
    zipCode: [
      rules.required("Zip code is required"),
      rules.numeric(),
      rules.minLength(5),
    ],
  };

  const {
    values,
    errors,
    setFieldValue,
    handleChange,
    handleBlur,
    handleSubmit,
    getInputClass,
  } = useFormValidation({
    initialValues: userProfile || {},
    validationRules,
    onSubmit: async (formValues) => {
      setIsSubmitting(true);
      setSubmitMessage("");
      setSubmitError("");

      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User not found. Please login again.");
        }

        const formData = new FormData();
        formData.append("fullName", formValues.fullName || "");
        formData.append("email", formValues.email || userProfile?.email || "");
        formData.append("mobile", formValues.mobile || "");
        formData.append("gender", formValues.gender || "");
        formData.append("address", formValues.address || "");
        formData.append("city", formValues.city || "");
        formData.append("state", formValues.state || "");
        formData.append("zipCode", formValues.zipCode || "");

        if (selectedProfileFile) {
          formData.append("profile_picture", selectedProfileFile);
        } else if (userProfile?.profilePicture) {
          formData.append("profilePicture", userProfile.profilePicture);
        }

        const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
          method: "PUT",
          headers: localStorage.getItem("userToken")
            ? { Authorization: `Bearer ${localStorage.getItem("userToken")}` }
            : {},
          body: formData,
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error || result.message || "Failed to update profile");
        }

        const updatedProfile = result?.data || {};
        setUserProfile(updatedProfile);
        setProfilePreview(getProfilePictureUrl(updatedProfile.profilePicture));
        setSelectedProfileFile(null);
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        localStorage.setItem("userName", updatedProfile.fullName || "");
        localStorage.setItem("userEmail", updatedProfile.email || "");
        setSubmitMessage("Profile updated successfully!");
        setIsEditing(false);

        setTimeout(() => setSubmitMessage(""), 3000);
      } catch (error) {
        setSubmitError(error.message || "Failed to update profile");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!userProfile) return;

    const profileHydrationKey = JSON.stringify({
      fullName: userProfile.fullName || "",
      email: userProfile.email || "",
      mobile: userProfile.mobile || "",
      address: userProfile.address || "",
      city: userProfile.city || "",
      state: userProfile.state || "",
      zipCode: userProfile.zipCode || "",
      gender: userProfile.gender || "",
      profilePicture: userProfile.profilePicture || "",
    });

    if (isEditing && lastHydratedProfileKeyRef.current === profileHydrationKey) {
      return;
    }

    lastHydratedProfileKeyRef.current = profileHydrationKey;

    const keys = ["fullName", "email", "mobile", "address", "city", "state", "zipCode", "gender"];
    keys.forEach((key) => {
      setFieldValue(key, userProfile[key] || "");
    });
  }, [userProfile, isEditing, setFieldValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userProfile");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get("tab");
    if (queryTab === "orders") {
      setActiveTab("orders");
      return;
    }

    if (queryTab === "profile" || !queryTab) {
      setActiveTab("profile");
    }
  }, [location.search]);

  const handleTabSwitch = (tabKey) => {
    setActiveTab(tabKey);
    navigate(`/profile?tab=${tabKey}`, { replace: true });
  };

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return `INR ${Number.isFinite(numeric)
      ? numeric.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "0.00"}`;
  };

  const handleDownloadInvoice = (order) => {
    if (!order) return;

    const orderId = String(order?._id || "").slice(-8).toUpperCase();
    const invoiceNumber = `INV-${orderId || "N/A"}`;
    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-";
    const customerName = userProfile?.fullName || order?.userId?.fullName || "Guest";
    const customerEmail = userProfile?.email || order?.userId?.email || "-";
    const customerMobile = userProfile?.mobile || order?.userId?.mobile || "-";

    const shipping = order?.shippingAddress || {};
    const shippingAddress = [shipping.street, shipping.city, shipping.state, shipping.zipCode, shipping.country]
      .filter(Boolean)
      .join(", ") || "-";

    const rows = Array.isArray(order?.items)
      ? order.items.map((item, index) => {
          const itemName = item?.name || item?.productId?.name || "Item";
          const itemPrice = Number(item?.price || item?.productId?.price || 0);
          const quantity = Number(item?.quantity || 0);
          const total = itemPrice * quantity;
          return [index + 1, itemName, quantity, formatCurrency(itemPrice), formatCurrency(total)];
        })
      : [];

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("SweetSlice Invoice", 40, 48);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Invoice Number: ${invoiceNumber}`, 40, 74);
      doc.text(`Order Number: ${orderId || "-"}`, 40, 92);
      doc.text(`Order Date: ${orderDate}`, 40, 110);
      doc.text(`Payment: ${order?.paymentMethod || "-"} (${order?.paymentStatus || "-"})`, 40, 128);

      doc.setFont("helvetica", "bold");
      doc.text("Bill To", 40, 160);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${customerName}`, 40, 178);
      doc.text(`Email: ${customerEmail}`, 40, 196);
      doc.text(`Phone: ${customerMobile}`, 40, 214);

      doc.setFont("helvetica", "bold");
      doc.text("Shipping Address", 320, 160);
      doc.setFont("helvetica", "normal");
      doc.text(shippingAddress, 320, 178, { maxWidth: 235 });

      autoTable(doc, {
        startY: 246,
        head: [["#", "Item", "Qty", "Unit Price", "Total"]],
        body: rows.length ? rows : [["-", "No items", "-", "-", "-"]],
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 6,
          lineColor: [225, 210, 194],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [113, 73, 51],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      const totalAmount = formatCurrency(order?.totalAmount || 0);
      const finalY = doc.lastAutoTable?.finalY || 290;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Grand Total: ${totalAmount}`, 40, finalY + 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Thank you for choosing SweetSlice.", 40, finalY + 52);

      doc.save(`${invoiceNumber}.pdf`);
    } catch {
      setOrdersError("Failed to generate invoice PDF. Please try again.");
    }
  };

  const getOrderStatusSteps = (status) => {
    const normalizedStatus = String(status || "pending").toLowerCase();
    if (normalizedStatus === 'cancelled') {
      return [
        {
          key: 'cancelled',
          label: 'Cancelled',
          active: true,
        },
      ];
    }

    const steps = ["pending", "processing", "shipped", "delivered"];
    const activeIndex = Math.max(0, steps.indexOf(normalizedStatus));

    return steps.map((step, index) => ({
      key: step,
      label: step.charAt(0).toUpperCase() + step.slice(1),
      active: index <= activeIndex,
    }));
  };

  const handleCancelOrder = async (orderId) => {
    if (!orderId) return;
    const confirmCancel = window.confirm('Cancel this order? This action cannot be undone.');
    if (!confirmCancel) return;

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      setSubmitError('Please login again to cancel this order.');
      return;
    }

    setCancellingOrderId(orderId);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to cancel order');
      }

      setSubmitMessage('Order cancelled successfully.');
      await loadUserOrders(localStorage.getItem('userId'));
      setTimeout(() => setSubmitMessage(''), 2500);
    } catch (error) {
      setSubmitError(error.message || 'Unable to cancel order');
    } finally {
      setCancellingOrderId('');
    }
  };

  if (!userProfile) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-row">
        <CakeParticlesLayer />
        <div className="profile-title-block">
          <h2>My Profile</h2>
          <p>Manage your account and view order history</p>
        </div>
      </div>

      <div className="profile-shell">
        <div className="profile-tab-switcher" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => handleTabSwitch("profile")}
          >
            Profile Info
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => handleTabSwitch("orders")}
          >
            Order History
          </button>
        </div>

        {submitMessage && <div className="alert alert-success mb-3">{submitMessage}</div>}
        {submitError && <div className="alert alert-danger mb-3">{submitError}</div>}

        {activeTab === "profile" && (
          <div className="profile-panel-card">
            <div className="profile-top-row">
              <div className="profile-identity-block">
                <div className="profile-avatar-wrap">
                  <img
                    src={
                      profilePreview ||
                      "https://via.placeholder.com/150?text=Profile"
                    }
                    alt="Profile"
                    className="profile-image"
                  />
                </div>
                <div className="profile-info">
                  <h4>{userProfile.fullName || "User Profile"}</h4>
                  <p className="text-muted">{userProfile.email || "Not provided"}</p>
                </div>
              </div>

              <div className="profile-actions-inline">
                <button
                  type="button"
                  className="btn profile-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="btn btn-logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="profile-upload-row">
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}

            {isEditing ? (
              <div className="edit-profile-card in-panel">
              <h5>Edit Profile</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`form-control ${getInputClass("fullName")}`}
                      name="fullName"
                      value={values.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.fullName && (
                      <div className="invalid-feedback d-block">
                        {errors.fullName}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className={`form-control ${getInputClass("email")}`}
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.email && (
                      <div className="invalid-feedback d-block">
                        {errors.email}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mobile *</label>
                    <input
                      type="tel"
                      className={`form-control ${getInputClass("mobile")}`}
                      name="mobile"
                      value={values.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.mobile && (
                      <div className="invalid-feedback d-block">
                        {errors.mobile}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className={`form-control ${getInputClass("city")}`}
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.city && (
                      <div className="invalid-feedback d-block">
                        {errors.city}
                      </div>
                    )}
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address *</label>
                    <textarea
                      className={`form-control ${getInputClass("address")}`}
                      name="address"
                      rows="3"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.address && (
                      <div className="invalid-feedback d-block">
                        {errors.address}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className={`form-control ${getInputClass("state")}`}
                      name="state"
                      value={values.state}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.state && (
                      <div className="invalid-feedback d-block">
                        {errors.state}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Zip Code *</label>
                    <input
                      type="text"
                      className={`form-control ${getInputClass("zipCode")}`}
                      name="zipCode"
                      value={values.zipCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.zipCode && (
                      <div className="invalid-feedback d-block">
                        {errors.zipCode}
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
            ) : (
              <>
                <div className="profile-details-card mb-4">
                <h5>Profile Information</h5><br/>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <p>{userProfile.fullName || "Not provided"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{userProfile.email || "Not provided"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Mobile</label>
                    <p>{userProfile.mobile || "Not provided"}</p>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <p>{userProfile.city || "Not provided"}</p>
                  </div>
                  <div className="detail-item">
                    <label>State</label>
                    <p>{userProfile.state || "Not provided"}</p>
                  </div>
                  <div className="detail-item">
                    <label>Zip Code</label>
                    <p>{userProfile.zipCode || "Not provided"}</p>
                  </div>
                  <div className="detail-item full-width">
                    <label>Address</label>
                    <p>{userProfile.address || "Not provided"}</p>
                  </div>
                </div>
              </div>

                <div className="profile-stats-panel">
                  <h6>Account Statistics</h6>
                  <div className="profile-stats">
                    <div className="stat">
                      <p className="stat-value">{orderStats.total}</p>
                      <p className="stat-label">Total Orders</p>
                    </div>
                    <div className="stat">
                      <p className="stat-value">{orderStats.delivered}</p>
                      <p className="stat-label">Delivered</p>
                    </div>
                    <div className="stat">
                      <p className="stat-value">₹{orderStats.spent.toFixed(2)}</p>
                      <p className="stat-label">Total Spent</p>
                    </div>
                    <div className="stat">
                      <p className="stat-value">{wishlistCount}</p>
                      <p className="stat-label">Wishlist Items</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="orders-card profile-panel-card">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <h5 className="mb-0">Order History</h5>
              <small className="text-muted">
                {ordersLastSyncedAt ? `Live tracking updated ${ordersLastSyncedAt}` : 'Live tracking enabled'}
              </small>
            </div>
            {ordersError && <p className="text-muted">{ordersError}</p>}
            {ordersLoading && <p className="text-muted">Loading recent orders...</p>}

            {!ordersLoading && !ordersError && recentOrders.length === 0 && (
              <p className="text-muted">No orders yet. Start shopping!</p>
            )}

            {!ordersLoading && !ordersError && recentOrders.length > 0 && (
              <div className="recent-orders-list">
                {recentOrders.map((order) => (
                  <div key={order._id} className="recent-order-item">
                    <div>
                      <p className="order-id">Order #{order._id?.slice(-6)?.toUpperCase()}</p>
                      <p className="order-date">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.wantsCustomization && (
                        <p className="order-customization-note">
                          Customization: {order.customizationNote?.trim() || "Requested"}
                        </p>
                      )}
                      {(order.couponCode || Number(order.discountAmount || 0) > 0) && (
                        <p className="order-customization-note">
                          Coupon: {order.couponCode || 'Applied'} {Number(order.discountAmount || 0) > 0 ? `(-₹${Number(order.discountAmount || 0).toFixed(2)})` : ''}
                        </p>
                      )}
                      {(order.deliveryDate || order.deliverySlot) && (
                        <p className="order-customization-note">
                          Delivery: {order.deliveryDate || 'Any day'} {order.deliverySlot ? `(${order.deliverySlot})` : ''}
                        </p>
                      )}
                      <div className="order-tracking-strip" aria-label={`Tracking for order ${order._id}`}>
                        {getOrderStatusSteps(order.status).map((step) => (
                          <span key={step.key} className={`order-tracking-step ${step.active ? 'active' : ''}`}>
                            {step.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="order-meta">
                      <span className={`order-status status-${order.status || "pending"}`}>
                        {order.status || "pending"}
                      </span>
                      <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                      {['pending', 'processing', 'shipped'].includes(String(order.status || '').toLowerCase()) && (
                        <button
                          type="button"
                          className="btn order-cancel-btn"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrderId === order._id}
                        >
                          {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn order-invoice-btn"
                        onClick={() => handleDownloadInvoice(order)}
                      >
                        Invoice PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
