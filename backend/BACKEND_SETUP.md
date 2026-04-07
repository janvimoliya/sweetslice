# SweetSlice Backend - Complete Setup Summary

## Project Structure
```
backend/
├── config/
│   ├── database.js          # MongoDB connection configuration
│   └── multer.js            # File upload configuration
├── controllers/
│   ├── User.controller.js           # User registration, login, profile
│   ├── Product.controller.js         # Product CRUD & filtering
│   ├── Order.controller.js           # Order management
│   ├── Cart.controller.js            # Shopping cart operations
│   ├── Wishlist.controller.js        # Wishlist management
│   ├── Register.controller.js        # User registration (legacy)
│   └── Contact.controller.js         # Contact form handling
├── middleware/
│   ├── authMiddleware.js            # JWT authentication
│   ├── validationMiddleware.js       # Request validation
│   └── filevalidator.js             # File upload validation
├── model/
│   ├── User.js              # User schema
│   ├── Product.js           # Product schema
│   ├── Order.js             # Order schema
│   ├── Cart.js              # Cart schema
│   ├── Wishlist.js          # Wishlist schema
│   ├── Register.js          # User registration schema (legacy)
│   └── Contact.js           # Contact schema
├── routes/
│   ├── userRoutes.js        # User endpoints
│   ├── productRoutes.js      # Product endpoints
│   ├── orderRoutes.js        # Order endpoints
│   ├── cartRoutes.js         # Cart endpoints
│   ├── wishlistRoutes.js     # Wishlist endpoints
│   ├── registerRoutes.js     # Registration endpoints
│   └── contactRoutes.js      # Contact endpoints
├── seeds/
│   └── productSeeds.js      # 20 pre-configured cake products
├── uploads/
│   ├── products/            # Product image uploads
│   └── profilePics/         # User profile pictures
├── package.json
├── server.js                # Express server entry point
└── API_DOCUMENTATION.md     # Complete API reference
```

---

## Implemented Features

### 1. User Management
- ✅ User Registration (email, password hashing)
- ✅ User Login (authentication)
- ✅ User Profile Management (CRUD)
- ✅ Password encryption with bcryptjs

**Endpoints:**
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/all` - Get all users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update profile
- `DELETE /api/users/:userId` - Delete account

### 2. Product Management
- ✅ Product CRUD Operations
- ✅ 20 Pre-seeded Cake Products
- ✅ Category Filtering (Chocolate, Vanilla, Cheesecake, Special)
- ✅ Search Functionality
- ✅ Sorting (by name, price, rating)

**Categories:**
- Chocolate (Black Forest, Swiss Rolls, Mousse)
- Vanilla (Lemon Zest, Coconut Paradise, Raspberry Dream)
- Cheesecake (Strawberry, White Chocolate, Blueberry, Tiramisu)
- Special (Red Velvet, Carrot Cake, Cappuccino, Matcha, Pistachio)

**Endpoints:**
- `POST /api/products/create` - Create product
- `GET /api/products/all` - Get all products (with filters/sort)
- `GET /api/products/category/:category` - Filter by category
- `GET /api/products/:productId` - Get product details
- `PUT /api/products/:productId` - Update product
- `DELETE /api/products/:productId` - Delete product

### 3. Shopping Cart
- ✅ Add items to cart
- ✅ Update quantities
- ✅ Remove items
- ✅ Clear entire cart
- ✅ Calculate total price

**Endpoints:**
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/:userId/update` - Update quantity
- `DELETE /api/cart/:userId/remove` - Remove item
- `DELETE /api/cart/:userId/clear` - Clear cart

### 4. Wishlist Management
- ✅ Add items to wishlist
- ✅ Remove items
- ✅ Clear wishlist
- ✅ Check if item in wishlist

**Endpoints:**
- `GET /api/wishlist/:userId` - Get wishlist
- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/:userId/remove` - Remove from wishlist
- `DELETE /api/wishlist/:userId/clear` - Clear wishlist
- `GET /api/wishlist/:userId/check?productId=...` - Check if item exists

### 5. Order Management
- ✅ Create Orders
- ✅ Order History
- ✅ Track Order Status (pending → processing → shipped → delivered)
- ✅ Cancel Orders
- ✅ Payment Status Tracking

**Endpoints:**
- `POST /api/orders/create` - Create new order
- `GET /api/orders/all` - Get all orders (admin)
- `GET /api/orders/user/:userId` - Get user's orders
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId/status` - Update order status
- `PUT /api/orders/:orderId/cancel` - Cancel order
- `DELETE /api/orders/:orderId` - Delete order

### 6. Contact Form
- ✅ Submit inquiries
- ✅ Contact management (admin)

**Endpoints:**
- `POST /api/contact/createContact` - Submit contact form
- `GET /api/contact/allContacts` - Get all messages
- `PUT /api/contact/updateContact/:contactId` - Update status
- `DELETE /api/contact/deleteContact/:contactId` - Delete message

---

## Database Models

### User Schema
```javascript
{
  email: String (unique),
  fullName: String,
  mobile: String,
  password: String (hashed),
  gender: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  profilePicture: String,
  timestamps: true
}
```

### Product Schema
```javascript
{
  name: String,
  category: Enum ['Chocolate', 'Vanilla', 'Cheesecake', 'Special'],
  price: Number,
  image: String,
  description: String,
  rating: Number (0-5),
  inStock: Boolean,
  quantity: Number,
  timestamps: true
}
```

### Order Schema
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  status: Enum ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  paymentStatus: Enum ['pending', 'completed', 'failed'],
  paymentMethod: String,
  timestamps: true
}
```

### Cart Schema
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalPrice: Number,
  timestamps: true
}
```

### Wishlist Schema
```javascript
{
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    rating: Number,
    image: String
  }],
  timestamps: true
}
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup MongoDB
- Ensure MongoDB is running locally or use MongoDB Atlas
- Update `MONGODB_URI` in `.env`

### 3. Environment Variables (.env)
```
MONGODB_URI=mongodb://localhost:27017/sweetslice
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key
```

### 4. Seed Products
```bash
node seeds/productSeeds.js
```

### 5. Start Server
```bash
npm start
```

Server will run on `http://localhost:5000`

---

## API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* operation data */ },
  "error": null
}
```

### Error Response
```json
{
  "message": "Operation failed",
  "error": "Error details",
  "data": null
}
```

---

## Technologies Used

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcryptjs
- **Validation:** Express Validator
- **File Uploads:** Multer
- **Middleware:** CORS, Body Parser

---

## Middleware Available

### Authentication Middleware
```javascript
import { authMiddleware, adminMiddleware } from './middleware/authMiddleware.js';

// Protect routes
router.put('/:id', authMiddleware, updateHandler);
```

### Validation Middleware
```javascript
import { validationMiddleware } from './middleware/validationMiddleware.js';

router.post('/', validationMiddleware, createHandler);
```

---

## Integration with Frontend

The frontend (React) connects to this backend at:
- Base URL: `http://localhost:5000/api`
- Components use context providers (CartProvider, WishlistProvider)
- Validation rules match backend schemas

---

## Next Steps

1. ✅ Install frontend dependencies: `npm install` (in sweetslice/)
2. ✅ Install backend dependencies: `npm install` (in sweetslice/backend)
3. ✅ Configure `.env` files for both
4. ✅ Seed database with products
5. ✅ Start backend: `npm start` (port 5000)
6. ✅ Start frontend: `npm run dev` (port 5173)

---

## File Organization

- **Controllers:** Business logic for each feature
- **Models:** Database schemas with validation
- **Routes:** API endpoint definitions
- **Middleware:** Cross-cutting concerns (auth, validation)
- **Config:** Database and external service setup
- **Seeds:** Initial data population

---

## Notes

- All passwords are hashed using bcryptjs before storage
- MongoDB uses Mongoose for schema validation
- CORS is configured for frontend communication
- Product images use placeholder URLs (can be replaced)
- 20 cake products are pre-seeded for immediate testing

