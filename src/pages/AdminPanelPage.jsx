import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/AdminPanelPage.css';
import CakeParticlesLayer from '../components/CakeParticlesLayer';
import AdminProductsSection from '../components/admin/sections/AdminProductsSection';
import AdminUsersSection from '../components/admin/sections/AdminUsersSection';
import AdminOrdersSection from '../components/admin/sections/AdminOrdersSection';
import AdminOffersSection from '../components/admin/sections/AdminOffersSection';
import AdminContactsSection from '../components/admin/sections/AdminContactsSection';
import AdminCategoriesSection from '../components/admin/sections/AdminCategoriesSection';
import AdminReviewsSection from '../components/admin/sections/AdminReviewsSection';
import {
  createInitialCategoryForm,
  createInitialProductForm,
  createInitialUserForm,
  createInitialOrderForm,
  createInitialOfferForm,
  createInitialContactForm,
  validateProductForm,
  validateUserForm,
  validateOrderForm,
  validateOfferForm,
  validateContactForm,
  validateCategoryForm,
} from '../components/admin/adminPanelFormHelpers';

const DEFAULT_CATEGORIES = [
  'Birthday Cakes',
  'Wedding Cakes',
  'Specialty Cakes',
  'Cupcakes',
  'Mini Cakes',
  'Chocolate',
  'Vanilla',
  'Cheesecake',
  'Special',
];

function AdminPanelPage() {
  const apiBaseUrl = 'http://localhost:5000';
  const productsPerPage = 8;
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');
  const adminId = localStorage.getItem('adminId') || 'admin';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productPage, setProductPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeSalesPoint, setActiveSalesPoint] = useState(null);

  const [stats, setStats] = useState({
    productsCount: 0,
    usersCount: 0,
    ordersCount: 0,
    offersCount: 0,
    contactsCount: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('adminCustomCategories') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [categoryForm, setCategoryForm] = useState(createInitialCategoryForm());
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');

  const [editingIds, setEditingIds] = useState({
    products: '',
    users: '',
    orders: '',
    offers: '',
    contacts: '',
    categories: '',
  });

  const [productForm, setProductForm] = useState(createInitialProductForm());

  const [userForm, setUserForm] = useState(createInitialUserForm());

  const [orderForm, setOrderForm] = useState(createInitialOrderForm());

  const [offerForm, setOfferForm] = useState(createInitialOfferForm());

  const [contactForm, setContactForm] = useState(createInitialContactForm());

  const [formErrors, setFormErrors] = useState({
    products: {},
    users: {},
    orders: {},
    offers: {},
    contacts: {},
    categories: {},
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    }),
    [adminToken]
  );

  const productCategories = useMemo(() => {
    const fromProducts = products
      .map((product) => String(product.category || '').trim())
      .filter(Boolean);

    const merged = [...DEFAULT_CATEGORIES, ...customCategories, ...fromProducts];
    return [...new Set(merged)].sort((a, b) => a.localeCompare(b));
  }, [products, customCategories]);

  const orderStatusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentStatusOptions = ['pending', 'completed', 'failed'];
  const paymentMethodOptions = ['credit-card', 'paypal', 'bank-transfer', 'upi', 'cod'];

  const filteredProducts = useMemo(() => {
    const searchValue = productSearchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        productCategoryFilter === 'all' ||
        String(product.category || '').trim().toLowerCase() === productCategoryFilter.toLowerCase();

      if (!matchesCategory) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableFields = [
        product.name,
        product.category,
        product.description,
        product.price,
        product.rating,
        product.quantity,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [products, productSearchTerm, productCategoryFilter]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((productPage - 1) * productsPerPage, productPage * productsPerPage),
    [productPage, filteredProducts]
  );

  const filteredUsers = useMemo(() => {
    const searchValue = userSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return users;
    }

    return users.filter((user) => {
      const searchableFields = [
        user.fullName,
        user.email,
        user.mobile,
        user.gender,
        user.address,
        user.city,
        user.state,
        user.zipCode,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [users, userSearchTerm]);

  const filteredOrders = useMemo(() => {
    const searchValue = orderSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return orders;
    }

    return orders.filter((order) => {
      const customizationNote = String(order.customizationNote || '').trim();
      const searchableFields = [
        order._id,
        order.userId?._id || order.userId,
        order.userId?.fullName,
        order.status,
        order.paymentStatus,
        order.paymentMethod,
        order.couponCode,
        order.deliveryDate,
        order.deliverySlot,
        order.totalAmount,
        order.wantsCustomization ? 'customization requested' : 'no customization',
        customizationNote,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [orders, orderSearchTerm]);

  const filteredOffers = useMemo(() => {
    const searchValue = offerSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return offers;
    }

    return offers.filter((offer) => {
      const searchableFields = [
        offer.title,
        offer.code,
        offer.description,
        offer.discountPercentage,
        offer.discountValue,
        offer.bannerText,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [offers, offerSearchTerm]);

  const filteredContacts = useMemo(() => {
    const searchValue = contactSearchTerm.trim().toLowerCase();
    if (!searchValue) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const searchableFields = [
        contact.name,
        contact.email,
        contact.mobile,
        contact.subject,
        contact.message,
        contact.status,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [contacts, contactSearchTerm]);

  const filteredReviews = useMemo(() => {
    const searchValue = reviewSearchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      if (reviewStatusFilter !== 'all' && String(review.status || '').toLowerCase() !== reviewStatusFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableFields = [
        review.productName,
        review.userName,
        review.comment,
        review.status,
      ];

      return searchableFields.some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue));
    });
  }, [reviewSearchTerm, reviewStatusFilter, reviews]);

  const getProductImageSrc = (imageValue) => {
    if (!imageValue) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=220&q=80';
    }

    if (String(imageValue).startsWith('http')) {
      return imageValue;
    }

    if (String(imageValue).startsWith('/uploads/')) {
      return `${apiBaseUrl}${imageValue}`;
    }

    return `${apiBaseUrl}/uploads/products/${imageValue}`;
  };

  const clearFeedback = () => {
    setError('');
    setMessage('');
  };

  const clearEntityErrors = (entity) => {
    setFormErrors((prev) => ({ ...prev, [entity]: {} }));
  };

  const clearFieldError = (entity, fieldName) => {
    setFormErrors((prev) => {
      const nextEntityErrors = { ...prev[entity] };
      delete nextEntityErrors[fieldName];
      return { ...prev, [entity]: nextEntityErrors };
    });
  };

  const getFieldClass = (entity, fieldName, baseClass = 'form-control') =>
    formErrors[entity]?.[fieldName] ? `${baseClass} is-invalid` : baseClass;

  const getFieldError = (entity, fieldName) => formErrors[entity]?.[fieldName] || '';

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return `INR ${Number.isFinite(numeric)
      ? numeric.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00'}`;
  };

  const handleGenerateInvoice = (order) => {
    if (!order) return;

    const orderId = String(order?._id || '').slice(-8).toUpperCase();
    const invoiceNumber = `INV-${orderId || 'N/A'}`;
    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-';
    const customerName = order?.userId?.fullName || 'Guest';
    const customerEmail = order?.userId?.email || '-';
    const customerMobile = order?.userId?.mobile || '-';
    const shipping = order?.shippingAddress || {};
    const shippingAddress = [shipping.street, shipping.city, shipping.state, shipping.zipCode, shipping.country]
      .filter(Boolean)
      .join(', ') || '-';

    const rows = Array.isArray(order?.items)
      ? order.items.map((item, index) => {
          const itemName = item?.name || item?.productId?.name || 'Item';
          const itemPrice = Number(item?.price || item?.productId?.price || 0);
          const quantity = Number(item?.quantity || 0);
          const total = itemPrice * quantity;
          return [
            index + 1,
            itemName,
            quantity,
            formatCurrency(itemPrice),
            formatCurrency(total),
          ];
        })
      : [];

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SweetSlice Invoice', 40, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Invoice Number: ${invoiceNumber}`, 40, 74);
      doc.text(`Order Number: ${orderId || '-'}`, 40, 92);
      doc.text(`Order Date: ${orderDate}`, 40, 110);
      doc.text(`Payment: ${order?.paymentMethod || '-'} (${order?.paymentStatus || '-'})`, 40, 128);

      doc.setFont('helvetica', 'bold');
      doc.text('Bill To', 40, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${customerName}`, 40, 178);
      doc.text(`Email: ${customerEmail}`, 40, 196);
      doc.text(`Phone: ${customerMobile}`, 40, 214);

      doc.setFont('helvetica', 'bold');
      doc.text('Shipping Address', 320, 160);
      doc.setFont('helvetica', 'normal');
      doc.text(shippingAddress, 320, 178, { maxWidth: 235 });

      autoTable(doc, {
        startY: 246,
        head: [['#', 'Item', 'Qty', 'Unit Price', 'Total']],
        body: rows.length ? rows : [['-', 'No items', '-', '-', '-']],
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 6,
          lineColor: [225, 210, 194],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [113, 73, 51],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
      });

      const totalAmount = formatCurrency(order?.totalAmount || 0);
      const finalY = doc.lastAutoTable?.finalY || 290;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Grand Total: ${totalAmount}`, 40, finalY + 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you for choosing SweetSlice.', 40, finalY + 52);

      doc.save(`${invoiceNumber}.pdf`);
      setMessage(`Invoice PDF downloaded: ${invoiceNumber}.pdf`);
      setError('');
    } catch {
      setError('Failed to generate invoice PDF. Please try again.');
      setMessage('');
    }
  };

  const handleExportFullReport = () => {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });

      const toDate = (value) => {
        if (!value) return '-';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
      };

      const drawSectionTitle = (title, subtitle = '') => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(title, 34, 44);
        if (subtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(subtitle, 34, 62);
        }
      };

      drawSectionTitle('SweetSlice Full Admin Report', `Generated: ${now.toLocaleString()} | Admin: ${adminId}`);

      autoTable(doc, {
        startY: 78,
        head: [['Metric', 'Value']],
        body: [
          ['Products Count', String(Number(stats.productsCount || products.length || 0))],
          ['Users Count', String(Number(stats.usersCount || users.length || 0))],
          ['Orders Count', String(Number(stats.ordersCount || orders.length || 0))],
          ['Offers Count', String(Number(stats.offersCount || offers.length || 0))],
          ['Contacts Count', String(Number(stats.contactsCount || contacts.length || 0))],
          ['Total Revenue', formatCurrency(stats.totalRevenue || 0)],
        ],
        styles: {
          font: 'helvetica',
          fontSize: 11,
          cellPadding: 8,
          lineColor: [228, 216, 204],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [113, 73, 51],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
      });

      doc.addPage();
      drawSectionTitle('Products');
      autoTable(doc, {
        startY: 62,
        head: [['ID', 'Name', 'Category', 'Price', 'Qty', 'Rating', 'In Stock', 'Created']],
        body: products.length
          ? products.map((item) => [
              String(item._id || '').slice(-8),
              item.name || '-',
              item.category || '-',
              formatCurrency(item.price || 0),
              String(Number(item.quantity || 0)),
              String(Number(item.rating || 0).toFixed(1)),
              item.inStock ? 'Yes' : 'No',
              toDate(item.createdAt),
            ])
          : [['-', 'No products', '-', '-', '-', '-', '-', '-']],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [113, 73, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.addPage();
      drawSectionTitle('Users');
      autoTable(doc, {
        startY: 62,
        head: [['ID', 'Name', 'Email', 'Mobile', 'City', 'State', 'Status', 'Created']],
        body: users.length
          ? users.map((item) => [
              String(item._id || '').slice(-8),
              item.fullName || '-',
              item.email || '-',
              item.mobile || '-',
              item.city || '-',
              item.state || '-',
              item.isActive === false ? 'Inactive' : 'Active',
              toDate(item.createdAt),
            ])
          : [['-', 'No users', '-', '-', '-', '-', '-', '-']],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [113, 73, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.addPage();
      drawSectionTitle('Orders');
      autoTable(doc, {
        startY: 62,
        head: [['ID', 'User', 'Total', 'Order Status', 'Payment Status', 'Method', 'Items', 'Created']],
        body: orders.length
          ? orders.map((item) => [
              String(item._id || '').slice(-8),
              item.userId?.fullName || item.userId || '-',
              formatCurrency(item.totalAmount || 0),
              item.status || '-',
              item.paymentStatus || '-',
              item.paymentMethod || '-',
              String(Array.isArray(item.items) ? item.items.length : 0),
              toDate(item.createdAt),
            ])
          : [['-', 'No orders', '-', '-', '-', '-', '-', '-']],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [113, 73, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.addPage();
      drawSectionTitle('Offers');
      autoTable(doc, {
        startY: 62,
        head: [['ID', 'Title', 'Code', 'Discount %', 'Value', 'Active', 'Start', 'End']],
        body: offers.length
          ? offers.map((item) => [
              String(item._id || '').slice(-8),
              item.title || '-',
              item.code || '-',
              String(Number(item.discountPercentage || 0)),
              String(Number(item.discountValue || 0)),
              item.isActive ? 'Yes' : 'No',
              toDate(item.startDate),
              toDate(item.endDate),
            ])
          : [['-', 'No offers', '-', '-', '-', '-', '-', '-']],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [113, 73, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.addPage();
      drawSectionTitle('Contacts');
      autoTable(doc, {
        startY: 62,
        head: [['ID', 'Name', 'Email', 'Mobile', 'Subject', 'Status', 'Created']],
        body: contacts.length
          ? contacts.map((item) => [
              String(item._id || '').slice(-8),
              item.name || '-',
              item.email || '-',
              item.mobile || '-',
              item.subject || '-',
              item.status || '-',
              toDate(item.createdAt || item.created_at),
            ])
          : [['-', 'No contacts', '-', '-', '-', '-', '-']],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [113, 73, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.save(`sweetslice-full-report-${timestamp}.pdf`);
      setMessage('Full report PDF exported successfully');
      setError('');
    } catch {
      setError('Failed to export report. Please try again.');
      setMessage('');
    }
  };

  const adminFetch = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        headers: authHeaders,
        ...options,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const combinedErrors = Array.isArray(result.errors) ? result.errors.join(', ') : '';
        throw new Error(combinedErrors || result.message || 'Request failed');
      }

      return result;
    },
    [apiBaseUrl, authHeaders]
  );

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    clearFeedback();

    try {
      const [statsResult, productsResult, usersResult, ordersResult, offersResult, contactsResult, reviewsResult] =
        await Promise.all([
          adminFetch('/api/admin/dashboard/stats'),
          adminFetch('/api/admin/products'),
          adminFetch('/api/admin/users'),
          adminFetch('/api/admin/orders'),
          adminFetch('/api/admin/offers'),
          adminFetch('/api/admin/contacts'),
          adminFetch('/api/admin/reviews?status=all'),
        ]);

      setStats(statsResult.data || {});
      setProducts(productsResult.data || []);
      setUsers(usersResult.data || []);
      setOrders(ordersResult.data || []);
      setOffers(offersResult.data || []);
      setContacts(contactsResult.data || []);
      setReviews(reviewsResult.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  const refreshStats = useCallback(async () => {
    const statsResult = await adminFetch('/api/admin/dashboard/stats');
    setStats(statsResult.data || {});
  }, [adminFetch]);

  const refreshEntity = useCallback(
    async (entity) => {
      const endpoints = {
        products: '/api/admin/products',
        users: '/api/admin/users',
        orders: '/api/admin/orders',
        offers: '/api/admin/offers',
        contacts: '/api/admin/contacts',
        reviews: '/api/admin/reviews?status=all',
      };

      const result = await adminFetch(endpoints[entity]);
      const data = result.data || [];

      if (entity === 'products') setProducts(data);
      if (entity === 'users') setUsers(data);
      if (entity === 'orders') setOrders(data);
      if (entity === 'offers') setOffers(data);
      if (entity === 'contacts') setContacts(data);
      if (entity === 'reviews') setReviews(data);
    },
    [adminFetch]
  );

  const handleModerateReview = async (review, status) => {
    clearFeedback();

    try {
      await adminFetch(`/api/admin/reviews/${review._id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      setMessage(`Review ${status} successfully`);
      await refreshEntity('reviews');
      await refreshEntity('products');
      await refreshStats();
    } catch (moderationError) {
      setError(moderationError.message || 'Failed to moderate review');
    }
  };

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    loadAllAdminData();
  }, [adminToken, loadAllAdminData, navigate]);

  useEffect(() => {
    setProductPage(1);
  }, [filteredProducts.length]);

  useEffect(() => {
    if (productPage > totalProductPages) {
      setProductPage(totalProductPages);
    }
  }, [productPage, totalProductPages]);

  useEffect(() => {
    // Keep feedback as a short-lived notification instead of persistent page state.
    if (!message && !error) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 2500);

    return () => clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    // Clear stale alerts when switching admin sections.
    clearFeedback();
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('adminCustomCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  const filteredCategories = useMemo(() => {
    const searchValue = categorySearchTerm.trim().toLowerCase();
    const categories = productCategories.map((name) => ({
      name,
      source: customCategories.includes(name) ? 'Custom' : 'System',
      productCount: products.filter((product) => String(product.category || '').trim() === name).length,
    }));

    if (!searchValue) {
      return categories;
    }

    return categories.filter((item) =>
      [item.name, item.source, item.productCount]
        .some((fieldValue) => String(fieldValue || '').toLowerCase().includes(searchValue))
    );
  }, [categorySearchTerm, customCategories, productCategories, products]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    const fieldErrors = validateProductForm(productForm);
    setFormErrors((prev) => ({ ...prev, products: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please correct the highlighted product fields');
      return;
    }

    try {
      const payload = {
        ...productForm,
        name: productForm.name.trim(),
        image: productForm.image.replace(/\s+/g, "").trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        rating: Number(productForm.rating),
        quantity: Number(productForm.quantity),
      };

      const isEdit = Boolean(editingIds.products);
      const endpoint = isEdit ? `/api/admin/products/${editingIds.products}` : '/api/admin/products';

      await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(isEdit ? 'Product updated successfully' : 'Product created successfully');
      setEditingIds((prev) => ({ ...prev, products: '' }));
      setProductForm(createInitialProductForm());
      setIsProductModalOpen(false);
      clearEntityErrors('products');
      await refreshEntity('products');
      await refreshStats();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save product');
    }
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    const fieldErrors = validateUserForm(userForm, Boolean(editingIds.users));
    setFormErrors((prev) => ({ ...prev, users: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please correct the highlighted user fields');
      return;
    }

    try {
      const payload = {
        ...userForm,
        email: userForm.email.trim(),
        fullName: userForm.fullName.trim(),
      };

      if (!payload.password) {
        delete payload.password;
      }

      const isEdit = Boolean(editingIds.users);
      const endpoint = isEdit ? `/api/admin/users/${editingIds.users}` : '/api/admin/users';

      await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(isEdit ? 'User updated successfully' : 'User created successfully');
      setEditingIds((prev) => ({ ...prev, users: '' }));
      setUserForm(createInitialUserForm());
      setIsUserModalOpen(false);
      clearEntityErrors('users');
      await refreshEntity('users');
      await refreshStats();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save user');
    }
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    const { fieldErrors, parsedItems } = validateOrderForm(orderForm);
    setFormErrors((prev) => ({ ...prev, orders: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0 || !parsedItems) {
      setError('Please correct the highlighted order fields');
      return;
    }

    try {
      const payload = {
        userId: orderForm.userId,
        subtotalAmount: Number(orderForm.subtotalAmount || orderForm.totalAmount || 0),
        discountAmount: Number(orderForm.discountAmount || 0),
        couponCode: orderForm.couponCode,
        couponTitle: orderForm.couponTitle,
        totalAmount: Number(orderForm.totalAmount),
        status: orderForm.status,
        paymentStatus: orderForm.paymentStatus,
        paymentMethod: orderForm.paymentMethod,
        items: parsedItems,
        shippingAddress: {
          street: orderForm.street,
          city: orderForm.city,
          state: orderForm.state,
          zipCode: orderForm.zipCode,
          country: orderForm.country,
        },
        wantsCustomization: Boolean(orderForm.wantsCustomization),
        customizationNote: orderForm.customizationNote,
        deliveryDate: orderForm.deliveryDate,
        deliverySlot: orderForm.deliverySlot,
      };

      const isEdit = Boolean(editingIds.orders);
      const endpoint = isEdit ? `/api/admin/orders/${editingIds.orders}` : '/api/admin/orders';

      await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(isEdit ? 'Order updated successfully' : 'Order created successfully');
      setEditingIds((prev) => ({ ...prev, orders: '' }));
      setOrderForm(createInitialOrderForm());
      setIsOrderModalOpen(false);
      clearEntityErrors('orders');
      await refreshEntity('orders');
      await refreshStats();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save order');
    }
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    const fieldErrors = validateOfferForm(offerForm);
    setFormErrors((prev) => ({ ...prev, offers: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please correct the highlighted offer fields');
      return;
    }

    try {
      const payload = {
        ...offerForm,
        title: offerForm.title.trim(),
        description: offerForm.description.trim(),
        discountPercentage: Number(offerForm.discountPercentage),
        discountValue: Number(offerForm.discountValue),
        minPurchaseAmount: Number(offerForm.minPurchaseAmount),
        applicableProducts: offerForm.applicableProducts,
      };

      const isEdit = Boolean(editingIds.offers);
      const endpoint = isEdit ? `/api/admin/offers/${editingIds.offers}` : '/api/admin/offers';

      await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(isEdit ? 'Offer updated successfully' : 'Offer created successfully');
      setEditingIds((prev) => ({ ...prev, offers: '' }));
      setOfferForm(createInitialOfferForm());
      setIsOfferModalOpen(false);
      clearEntityErrors('offers');
      await refreshEntity('offers');
      await refreshStats();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save offer');
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    clearFeedback();

    const fieldErrors = validateContactForm(contactForm);
    setFormErrors((prev) => ({ ...prev, contacts: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please correct the highlighted contact fields');
      return;
    }

    try {
      const payload = {
        ...contactForm,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
      };

      const isEdit = Boolean(editingIds.contacts);
      const endpoint = isEdit ? `/api/admin/contacts/${editingIds.contacts}` : '/api/admin/contacts';

      await adminFetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(isEdit ? 'Contact updated successfully' : 'Contact created successfully');
      setEditingIds((prev) => ({ ...prev, contacts: '' }));
      setContactForm(createInitialContactForm());
      setIsContactModalOpen(false);
      clearEntityErrors('contacts');
      await refreshEntity('contacts');
      await refreshStats();
    } catch (submitError) {
      setError(submitError.message || 'Failed to save contact');
    }
  };

  const handleDelete = async (entity, id) => {
    if (!window.confirm('Delete this record?')) {
      return;
    }

    clearFeedback();

    const endpoints = {
      products: `/api/admin/products/${id}`,
      users: `/api/admin/users/${id}`,
      orders: `/api/admin/orders/${id}`,
      offers: `/api/admin/offers/${id}`,
      contacts: `/api/admin/contacts/${id}`,
    };

    try {
      await adminFetch(endpoints[entity], { method: 'DELETE' });
      setMessage('Record deleted successfully');
      await refreshEntity(entity);
      await refreshStats();
    } catch (deleteError) {
      setError(deleteError.message || 'Delete failed');
    }
  };

  const startEdit = (entity, item) => {
    clearFeedback();
    clearEntityErrors(entity);
    setEditingIds((prev) => ({ ...prev, [entity]: item._id }));

    if (entity === 'products') {
      setProductForm({
        name: item.name || '',
        category: item.category || 'Birthday Cakes',
        price: String(item.price ?? ''),
        image: item.image || '',
        description: item.description || '',
        rating: String(item.rating ?? 0),
        quantity: String(item.quantity ?? 0),
        inStock: Boolean(item.inStock),
      });
      setIsProductModalOpen(true);
    }

    if (entity === 'users') {
      setUserForm({
        email: item.email || '',
        fullName: item.fullName || '',
        mobile: item.mobile || '',
        password: '',
        gender: item.gender || 'other',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zipCode: item.zipCode || '',
        profilePicture: item.profilePicture || '',
      });
      setIsUserModalOpen(true);
    }

    if (entity === 'orders') {
      setOrderForm({
        userId: item.userId?._id || item.userId || '',
        totalAmount: String(item.totalAmount ?? ''),
        subtotalAmount: String(item.subtotalAmount ?? item.totalAmount ?? ''),
        discountAmount: String(item.discountAmount ?? 0),
        couponCode: item.couponCode || '',
        couponTitle: item.couponTitle || '',
        status: item.status || 'pending',
        paymentStatus: item.paymentStatus || 'pending',
        paymentMethod: item.paymentMethod || 'cod',
        itemsText: JSON.stringify(item.items || [], null, 2),
        street: item.shippingAddress?.street || '',
        city: item.shippingAddress?.city || '',
        state: item.shippingAddress?.state || '',
        zipCode: item.shippingAddress?.zipCode || '',
        country: item.shippingAddress?.country || '',
        wantsCustomization: Boolean(item.wantsCustomization),
        customizationNote: item.customizationNote || '',
        deliveryDate: item.deliveryDate || '',
        deliverySlot: item.deliverySlot || 'morning',
      });
      setIsOrderModalOpen(true);
    }

    if (entity === 'offers') {
      const formatDate = (dateValue) => (dateValue ? new Date(dateValue).toISOString().slice(0, 10) : '');

      setOfferForm({
        title: item.title || '',
        description: item.description || '',
        discountPercentage: String(item.discountPercentage ?? 0),
        discountType: item.discountType || 'percentage',
        discountValue: String(item.discountValue ?? 0),
        applicableProducts: Array.isArray(item.applicableProducts)
          ? item.applicableProducts
              .map((product) => (typeof product === 'string' ? product : product?._id))
              .filter(Boolean)
          : [],
        startDate: formatDate(item.startDate),
        endDate: formatDate(item.endDate),
        isActive: Boolean(item.isActive),
        image: item.image || '',
        code: item.code || '',
        minPurchaseAmount: String(item.minPurchaseAmount ?? 0),
        bannerText: item.bannerText || 'Limited Time Offer',
      });
      setIsOfferModalOpen(true);
    }

    if (entity === 'contacts') {
      setContactForm({
        name: item.name || '',
        email: item.email || '',
        mobile: item.mobile || '',
        subject: item.subject || '',
        message: item.message || '',
        reply: item.reply || '',
        status: item.status || 'Pending',
      });
      setIsContactModalOpen(true);
    }
  };

  const cancelEdit = (entity) => {
    clearFeedback();
    clearEntityErrors(entity);
    setEditingIds((prev) => ({ ...prev, [entity]: '' }));
    if (entity === 'products') {
      setIsProductModalOpen(false);
      setProductForm(createInitialProductForm());
    }
    if (entity === 'users') {
      setIsUserModalOpen(false);
      setUserForm(createInitialUserForm());
    }
    if (entity === 'offers') {
      setIsOfferModalOpen(false);
      setOfferForm(createInitialOfferForm());
    }
    if (entity === 'orders') {
      setIsOrderModalOpen(false);
      setOrderForm(createInitialOrderForm());
    }
    if (entity === 'categories') {
      setIsCategoryModalOpen(false);
      setCategoryForm(createInitialCategoryForm());
    }
    if (entity === 'contacts') {
      setIsContactModalOpen(false);
      setContactForm(createInitialContactForm());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    navigate('/admin/login');
  };

  const dashboardMetrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'pending').length;
    const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
    const lowStockCount = Number(stats.lowStockCount || 0) || products.filter((product) => {
      const quantity = Number(product.quantity || 0);
      return product.inStock !== false && quantity > 0 && quantity <= 5;
    }).length;
    const outOfStockCount = Number(stats.outOfStockCount || 0) || products.filter((product) => {
      const quantity = Number(product.quantity || 0);
      return product.inStock === false || quantity <= 0;
    }).length;

    return [
      {
        key: 'total-orders',
        label: 'Total Orders',
        value: Number(stats.ordersCount || orders.length || 0),
        delta: '+12%',
        deltaType: 'positive',
        icon: '◻',
      },
      {
        key: 'total-revenue',
        label: 'Total Revenue',
        value: `₹${Number(stats.totalRevenue || 0).toFixed(0)}`,
        delta: '+18%',
        deltaType: 'positive',
        icon: '$',
      },
      {
        key: 'pending-orders',
        label: 'Pending Orders',
        value: pendingOrders,
        delta: '-5%',
        deltaType: 'negative',
        icon: '▣',
      },
      {
        key: 'delivered-orders',
        label: 'Delivered',
        value: deliveredOrders,
        delta: '+23%',
        deltaType: 'positive',
        icon: '↗',
      },
      {
        key: 'pending-reviews',
        label: 'Pending Reviews',
        value: Number(stats.pendingReviewsCount || 0),
        delta: '+0%',
        deltaType: 'positive',
        icon: '★',
      },
      {
        key: 'low-stock',
        label: 'Low Stock',
        value: lowStockCount,
        delta: 'watch list',
        deltaType: 'negative',
        icon: '!',
      },
      {
        key: 'out-of-stock',
        label: 'Out of Stock',
        value: outOfStockCount,
        delta: 'needs restock',
        deltaType: 'negative',
        icon: '×',
      },
    ];
  }, [orders, products, stats.lowStockCount, stats.outOfStockCount, stats.ordersCount, stats.pendingReviewsCount, stats.totalRevenue]);

  const monthlySalesData = useMemo(() => {
    const fallback = [
      { month: 'Jan', value: 45000 },
      { month: 'Feb', value: 52000 },
      { month: 'Mar', value: 48000 },
      { month: 'Apr', value: 61000 },
      { month: 'May', value: 55000 },
      { month: 'Jun', value: 68000 },
    ];

    if (!orders.length) return fallback;

    const now = new Date();
    const points = [];

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = date.toLocaleString('en-US', { month: 'short' });

      const total = orders.reduce((sum, order) => {
        const created = new Date(order.createdAt || order.created_at || Date.now());
        const createdKey = `${created.getFullYear()}-${created.getMonth()}`;
        if (createdKey !== key) return sum;
        return sum + Number(order.totalAmount || 0);
      }, 0);

      points.push({ month, value: total });
    }

    const hasAnySales = points.some((point) => point.value > 0);
    return hasAnySales ? points : fallback;
  }, [orders]);

  const ordersByCategoryData = useMemo(() => {
    const fallback = [
      { name: 'Birthday', value: 45 },
      { name: 'Wedding', value: 28 },
      { name: 'Custom', value: 32 },
      { name: 'Chocolate', value: 38 },
      { name: 'Cupcakes', value: 52 },
      { name: 'Vegan', value: 18 },
    ];

    if (!products.length) return fallback;

    const grouped = products.reduce((accumulator, product) => {
      const key = String(product.category || 'Other').trim();
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const next = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return next.length ? next : fallback;
  }, [products]);

  const monthlySalesPoints = useMemo(() => {
    const maxValue = Math.max(...monthlySalesData.map((entry) => entry.value), 1);
    return monthlySalesData.map((point, index) => {
      const normalized = (point.value / maxValue) * 170;
      return {
        ...point,
        x: 40 + index * 114,
        y: 220 - normalized,
      };
    });
  }, [monthlySalesData]);

  const recentOrders = useMemo(
    () => orders.slice(0, 5),
    [orders]
  );

  const usersStats = useMemo(() => {
    const now = new Date();
    const newThisMonth = users.filter((user) => {
      const createdAt = user.createdAt || user.created_at;
      if (!createdAt) return false;
      const date = new Date(createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const activeUsers = users.filter((user) => user.isActive !== false).length;

    return {
      total: users.length,
      newThisMonth,
      active: activeUsers,
    };
  }, [users]);

  const lowStockProducts = useMemo(() => {
    return products
      .filter((product) => {
        const quantity = Number(product.quantity || 0);
        return product.inStock !== false && quantity > 0 && quantity <= 5;
      })
      .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
  }, [products]);

  const renderDashboard = () => (
    <div className="dashboard-layout">
      <div className="dashboard-kpi-grid">
        {dashboardMetrics.map((metric) => (
          <article className="dashboard-kpi-card" key={metric.key}>
            <div className="dashboard-kpi-top">
              <span className={`dashboard-kpi-icon dashboard-kpi-icon-${metric.key}`}>{metric.icon}</span>
              <span className={`dashboard-kpi-delta ${metric.deltaType === 'negative' ? 'negative' : 'positive'}`}>{metric.delta}</span>
            </div>
            <p className="dashboard-kpi-value">{metric.value}</p>
            <p className="dashboard-kpi-label">{metric.label}</p>
          </article>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <article className="dashboard-chart-card">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h3 className="mb-0">Low Stock Alerts</h3>
            <span className="badge bg-warning text-dark">
              {lowStockProducts.length} item{lowStockProducts.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-muted mb-3">These products are running low and should be restocked soon.</p>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.category || '-'}</td>
                    <td>{Number(product.quantity || 0)}</td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger-emphasis">Low Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <div className="dashboard-chart-grid">
        <article className="dashboard-chart-card">
          <h3>Monthly Sales</h3>
          <div className="dashboard-line-chart" onMouseLeave={() => setActiveSalesPoint(null)}>
            <svg viewBox="0 0 640 300" preserveAspectRatio="none" aria-label="Monthly Sales Chart">
              {[0, 1, 2, 3].map((step) => (
                <line key={`h-${step}`} x1="40" y1={40 + step * 65} x2="610" y2={40 + step * 65} className="chart-grid-line" />
              ))}
              {monthlySalesPoints.map((_, index) => (
                <line key={`v-${index}`} x1={40 + index * 114} y1="40" x2={40 + index * 114} y2="235" className="chart-grid-line" />
              ))}
              <polyline
                className="chart-line-path"
                points={monthlySalesPoints.map((point) => `${point.x},${point.y}`).join(' ')}
              />
              {monthlySalesPoints.map((point) => {
                const isActive = activeSalesPoint?.month === point.month;
                return (
                  <g key={`dot-${point.month}`} className="chart-point-group">
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="11"
                      className="chart-point-hitbox"
                      onMouseEnter={() => setActiveSalesPoint(point)}
                    />
                    <circle cx={point.x} cy={point.y} r={isActive ? '6' : '4'} className="chart-line-dot" />
                  </g>
                );
              })}
            </svg>

            {activeSalesPoint && (
              <div
                className="chart-sales-tooltip"
                style={{
                  left: `${(activeSalesPoint.x / 640) * 100}%`,
                  top: `${(activeSalesPoint.y / 300) * 100}%`,
                }}
              >
                <p className="chart-sales-tooltip-month">{activeSalesPoint.month}</p>
                <p className="chart-sales-tooltip-value">sales : {Number(activeSalesPoint.value).toLocaleString()}</p>
              </div>
            )}

            <div className="chart-x-axis">
              {monthlySalesData.map((point) => (
                <span key={`x-${point.month}`}>{point.month}</span>
              ))}
            </div>
          </div>
        </article>

        <article className="dashboard-chart-card">
          <h3>Orders by Category</h3>
          <div className="dashboard-bar-chart">
            {ordersByCategoryData.map((entry) => {
              const max = Math.max(...ordersByCategoryData.map((item) => item.value), 1);
              const barHeight = Math.max(18, Math.round((entry.value / max) * 100));
              return (
                <div className="bar-item" key={entry.name}>
                  <div className="bar-wrap">
                    <span className="bar-tooltip">{entry.name} orders : {entry.value}</span>
                    <div className="bar-fill" style={{ height: `${barHeight}%` }} />
                  </div>
                  <span className="bar-label">{entry.name}</span>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <article className="dashboard-recent-card">
        <h3>Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="dashboard-empty-state">No orders yet</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>#{String(order._id || '').slice(-8)}</td>
                    <td>{order.userId?.fullName || order.userId || 'Guest'}</td>
                    <td>{order.status || '-'}</td>
                    <td>₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );

  const toggleOfferApplicableProduct = (productId) => {
    setOfferForm((prev) => {
      const isSelected = prev.applicableProducts.includes(productId);
      return {
        ...prev,
        applicableProducts: isSelected
          ? prev.applicableProducts.filter((id) => id !== productId)
          : [...prev.applicableProducts, productId],
      };
    });
  };

  const handleCategorySubmit = (event) => {
    event.preventDefault();
    clearFeedback();

    const fieldErrors = validateCategoryForm({
      categoryForm,
      productCategories,
      editingCategory: editingIds.categories,
    });
    setFormErrors((prev) => ({ ...prev, categories: fieldErrors }));
    if (Object.keys(fieldErrors).length > 0) {
      setError('Please correct the highlighted category fields');
      return;
    }

    const nextName = categoryForm.name.trim();
    const previousName = editingIds.categories;

    if (previousName) {
      setCustomCategories((prev) => {
        const next = prev.map((item) => (item === previousName ? nextName : item));
        return [...new Set(next)].sort((a, b) => a.localeCompare(b));
      });

      setProducts((prev) => prev.map((product) => (
        String(product.category || '').trim() === previousName
          ? { ...product, category: nextName }
          : product
      )));

      if (productForm.category === previousName) {
        setProductForm((prev) => ({ ...prev, category: nextName }));
      }

      setMessage('Category updated successfully');
    } else {
      setCustomCategories((prev) => [...new Set([...prev, nextName])].sort((a, b) => a.localeCompare(b)));
      setMessage('Category created successfully');
    }

    setEditingIds((prev) => ({ ...prev, categories: '' }));
    setCategoryForm(createInitialCategoryForm());
    setIsCategoryModalOpen(false);
    clearEntityErrors('categories');
  };

  const startCategoryEdit = (categoryName) => {
    clearFeedback();
    clearEntityErrors('categories');
    setEditingIds((prev) => ({ ...prev, categories: categoryName }));
    setCategoryForm({ name: categoryName, description: '' });
    setIsCategoryModalOpen(true);
  };

  const deleteCategory = (categoryName) => {
    clearFeedback();

    const inUse = products.some((product) => String(product.category || '').trim() === categoryName);
    if (inUse) {
      setError('Cannot delete category that is in use by products');
      return;
    }

    setCustomCategories((prev) => prev.filter((item) => item !== categoryName));
    setMessage('Category deleted successfully');
  };

  const adminNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bi bi-grid' },
    { key: 'products', label: 'Products', icon: 'bi bi-box-seam' },
    { key: 'orders', label: 'Orders', icon: 'bi bi-bag' },
    { key: 'users', label: 'Users', icon: 'bi bi-people' },
    { key: 'offers', label: 'Offers', icon: 'bi bi-ticket-perforated' },
    { key: 'reviews', label: 'Reviews', icon: 'bi bi-stars' },
    { key: 'contacts', label: 'Contacts', icon: 'bi bi-chat-left-dots' },
    { key: 'categories', label: 'Categories', icon: 'bi bi-tags' },
  ];

  const activeSectionTitle = adminNavItems.find((item) => item.key === activeTab)?.label || 'Dashboard';
  const activeSectionSubtitle = activeTab === 'dashboard'
    ? "Welcome back! Here's your store overview."
    : `Manage ${activeSectionTitle.toLowerCase()} from one place.`;

  return (
    <section className="admin-panel-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <span className="admin-brand-icon">🍰</span>
              <div>
                <strong>SweetSlice</strong>
                <p>Admin Panel</p>
              </div>
            </div>
          </div>

          <div className="admin-sidebar-nav">
            {adminNavItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`admin-nav-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-sidebar-footer">
            <button type="button" className="btn admin-sidebar-action" onClick={() => navigate('/')}>
              Back to Store
            </button>
            <button type="button" className="btn admin-sidebar-action" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="admin-content">
          <div className="admin-panel-header">
            <CakeParticlesLayer />
            <div>
              <h2>{activeSectionTitle}</h2>
              <p className="admin-subtitle">{activeSectionSubtitle}</p>
            </div>
            <div className="admin-actions">
              <span className="admin-id">Admin: {adminId}</span>
              <button type="button" className="btn btn-outline-dark" onClick={() => navigate('/admin/profile')}>
                Profile
              </button>
              <button type="button" className="btn btn-outline-dark" onClick={loadAllAdminData}>
                Refresh
              </button>
              <button type="button" className="btn btn-outline-dark" onClick={handleExportFullReport}>
                Export Report
              </button>
            </div>
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? <p>Loading dashboard...</p> : null}

          {!loading && activeTab === 'dashboard' && renderDashboard()}

      {!loading && activeTab === 'products' && (
        <AdminProductsSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setProductForm={setProductForm}
          setIsProductModalOpen={setIsProductModalOpen}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          productCategoryFilter={productCategoryFilter}
          setProductCategoryFilter={setProductCategoryFilter}
          productCategories={productCategories}
          paginatedProducts={paginatedProducts}
          getProductImageSrc={getProductImageSrc}
          startEdit={startEdit}
          handleDelete={handleDelete}
          filteredProducts={filteredProducts}
          productPage={productPage}
          productsPerPage={productsPerPage}
          setProductPage={setProductPage}
          totalProductPages={totalProductPages}
          isProductModalOpen={isProductModalOpen}
          editingIds={editingIds}
          cancelEdit={cancelEdit}
          handleProductSubmit={handleProductSubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          productForm={productForm}
        />
      )}

      {!loading && activeTab === 'users' && (
        <AdminUsersSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setUserForm={setUserForm}
          setIsUserModalOpen={setIsUserModalOpen}
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          usersStats={usersStats}
          filteredUsers={filteredUsers}
          startEdit={startEdit}
          handleDelete={handleDelete}
          isUserModalOpen={isUserModalOpen}
          cancelEdit={cancelEdit}
          editingIds={editingIds}
          handleUserSubmit={handleUserSubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          userForm={userForm}
        />
      )}

      {!loading && activeTab === 'orders' && (
        <AdminOrdersSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setOrderForm={setOrderForm}
          setIsOrderModalOpen={setIsOrderModalOpen}
          orderSearchTerm={orderSearchTerm}
          setOrderSearchTerm={setOrderSearchTerm}
          filteredOrders={filteredOrders}
          startEdit={startEdit}
          handleDelete={handleDelete}
          handleGenerateInvoice={handleGenerateInvoice}
          isOrderModalOpen={isOrderModalOpen}
          cancelEdit={cancelEdit}
          editingIds={editingIds}
          handleOrderSubmit={handleOrderSubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          orderForm={orderForm}
          paymentMethodOptions={paymentMethodOptions}
          orderStatusOptions={orderStatusOptions}
          paymentStatusOptions={paymentStatusOptions}
        />
      )}

      {!loading && activeTab === 'offers' && (
        <AdminOffersSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setOfferForm={setOfferForm}
          setIsOfferModalOpen={setIsOfferModalOpen}
          offerSearchTerm={offerSearchTerm}
          setOfferSearchTerm={setOfferSearchTerm}
          filteredOffers={filteredOffers}
          startEdit={startEdit}
          handleDelete={handleDelete}
          isOfferModalOpen={isOfferModalOpen}
          cancelEdit={cancelEdit}
          editingIds={editingIds}
          handleOfferSubmit={handleOfferSubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          offerForm={offerForm}
          products={products}
          toggleOfferApplicableProduct={toggleOfferApplicableProduct}
        />
      )}

      {!loading && activeTab === 'contacts' && (
        <AdminContactsSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setContactForm={setContactForm}
          setIsContactModalOpen={setIsContactModalOpen}
          contactSearchTerm={contactSearchTerm}
          setContactSearchTerm={setContactSearchTerm}
          filteredContacts={filteredContacts}
          startEdit={startEdit}
          handleDelete={handleDelete}
          isContactModalOpen={isContactModalOpen}
          cancelEdit={cancelEdit}
          editingIds={editingIds}
          handleContactSubmit={handleContactSubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          contactForm={contactForm}
        />
      )}

      {!loading && activeTab === 'reviews' && (
        <AdminReviewsSection
          reviewSearchTerm={reviewSearchTerm}
          setReviewSearchTerm={setReviewSearchTerm}
          reviewStatusFilter={reviewStatusFilter}
          setReviewStatusFilter={setReviewStatusFilter}
          filteredReviews={filteredReviews}
          handleModerateReview={handleModerateReview}
        />
      )}

      {!loading && activeTab === 'categories' && (
        <AdminCategoriesSection
          setEditingIds={setEditingIds}
          clearEntityErrors={clearEntityErrors}
          setCategoryForm={setCategoryForm}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          categorySearchTerm={categorySearchTerm}
          setCategorySearchTerm={setCategorySearchTerm}
          filteredCategories={filteredCategories}
          startCategoryEdit={startCategoryEdit}
          deleteCategory={deleteCategory}
          isCategoryModalOpen={isCategoryModalOpen}
          cancelEdit={cancelEdit}
          editingIds={editingIds}
          handleCategorySubmit={handleCategorySubmit}
          getFieldClass={getFieldClass}
          getFieldError={getFieldError}
          clearFieldError={clearFieldError}
          categoryForm={categoryForm}
        />
      )}

        </div>
      </div>
    </section>
  );
}

export default AdminPanelPage;
