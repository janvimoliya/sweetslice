# Backend API Documentation - SweetSlice E-commerce

## Base URL
```
http://localhost:5000/api
```

## Database Models

### User Model
```
- _id: MongoDB ObjectId
- email: String (unique, required)
- fullName: String
- mobile: String
- password: String (hashed with bcryptjs)
- gender: String
- address: String
- city: String
- state: String
- zipCode: String
- profilePicture: String (URL)
- createdAt: Date
- updatedAt: Date
```

### Product Model
```
- _id: MongoDB ObjectId
- name: String (required)
- category: Enum ['Chocolate', 'Vanilla', 'Cheesecake', 'Special'] (required)
- price: Number (required)
- image: String (URL)
- description: String
- rating: Number (0-5)
- inStock: Boolean
- quantity: Number
- createdAt: Date
- updatedAt: Date
```

### Order Model
```
- _id: MongoDB ObjectId
- userId: ObjectId (ref: User)
- items: Array of {
    productId: ObjectId (ref: Product)
    name: String
    price: Number
    quantity: Number
  }
- totalAmount: Number
- shippingAddress: {
    street: String
    city: String
    state: String
    zipCode: String
  }
- status: Enum ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
- paymentStatus: Enum ['pending', 'completed', 'failed']
- paymentMethod: String
- createdAt: Date
- updatedAt: Date
```

### Cart Model
```
- _id: MongoDB ObjectId
- userId: ObjectId (ref: User)
- items: Array of {
    productId: ObjectId (ref: Product)
    name: String
    price: Number
    quantity: Number
    image: String
  }
- totalPrice: Number
- createdAt: Date
- updatedAt: Date
```

### Wishlist Model
```
- _id: MongoDB ObjectId
- userId: ObjectId (ref: User)
- items: Array of {
    productId: ObjectId (ref: Product)
    name: String
    price: Number
    rating: Number
    image: String
  }
- createdAt: Date
- updatedAt: Date
```

---

## API Endpoints

### USER ENDPOINTS
**Base: `/api/users`**

#### 1. Register User
```
POST /register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "mobile": "9876543210",
  "password": "password123",
  "gender": "male",
  "address": "123 Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001"
}

Response:
{
  "message": "User registered successfully",
  "data": { user object },
  "error": null
}
```

#### 2. Login User
```
POST /login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "data": {
    "userId": "...",
    "email": "user@example.com",
    "token": "jwt_token_here"
  }
}
```

#### 3. Get All Users
```
GET /all

Response:
{
  "message": "Users fetched successfully",
  "data": [ { user objects } ]
}
```

#### 4. Get User by ID
```
GET /:userId

Response:
{
  "message": "User fetched successfully",
  "data": { user object }
}
```

#### 5. Update User
```
PUT /:userId
Content-Type: application/json

Body:
{
  "fullName": "Jane Doe",
  "mobile": "9876543210",
  "address": "456 Avenue",
  "profilePicture": "url_to_image"
}

Response:
{
  "message": "User updated successfully",
  "data": { updated user object }
}
```

#### 6. Delete User
```
DELETE /:userId

Response:
{
  "message": "User deleted successfully",
  "data": null
}
```

---

### PRODUCT ENDPOINTS
**Base: `/api/products`**

#### 1. Create Product
```
POST /create
Content-Type: application/json

Body:
{
  "name": "Chocolate Cake",
  "category": "Chocolate",
  "price": 499,
  "image": "url_to_image",
  "description": "Rich chocolate cake",
  "rating": 4.8,
  "inStock": true,
  "quantity": 50
}

Response:
{
  "message": "Product created successfully",
  "data": { product object }
}
```

#### 2. Get All Products
```
GET /all
Query Parameters (optional):
- search=cake (search by name)
- category=Chocolate
- sortBy=price (price, name, rating)
- sortType=asc (asc or desc)

Response:
{
  "message": "Products fetched successfully",
  "data": [ { product objects } ]
}
```

#### 3. Get Products by Category
```
GET /category/:category
Example: /category/Chocolate

Response:
{
  "message": "Products fetched successfully",
  "data": [ { product objects } ]
}
```

#### 4. Get Product by ID
```
GET /:productId

Response:
{
  "message": "Product fetched successfully",
  "data": { product object }
}
```

#### 5. Update Product
```
PUT /:productId
Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "price": 599,
  "quantity": 40,
  "inStock": true
}

Response:
{
  "message": "Product updated successfully",
  "data": { updated product object }
}
```

#### 6. Delete Product
```
DELETE /:productId

Response:
{
  "message": "Product deleted successfully",
  "data": null
}
```

---

### CART ENDPOINTS
**Base: `/api/cart`**

#### 1. Get Cart
```
GET /:userId

Response:
{
  "message": "Cart fetched successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [ { item objects } ],
    "totalPrice": 1500
  }
}
```

#### 2. Add to Cart
```
POST /add
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "productId": "product_id",
  "quantity": 2
}

Response:
{
  "message": "Item added to cart",
  "data": { cart object }
}
```

#### 3. Update Cart Item
```
PUT /:userId/update
Content-Type: application/json

Body:
{
  "productId": "product_id",
  "quantity": 3
}

Response:
{
  "message": "Cart item updated",
  "data": { cart object }
}
```

#### 4. Remove from Cart
```
DELETE /:userId/remove
Content-Type: application/json

Body:
{
  "productId": "product_id"
}

Response:
{
  "message": "Item removed from cart",
  "data": { cart object }
}
```

#### 5. Clear Cart
```
DELETE /:userId/clear

Response:
{
  "message": "Cart cleared",
  "data": { empty cart object }
}
```

---

### WISHLIST ENDPOINTS
**Base: `/api/wishlist`**

#### 1. Get Wishlist
```
GET /:userId

Response:
{
  "message": "Wishlist fetched successfully",
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [ { item objects } ]
  }
}
```

#### 2. Add to Wishlist
```
POST /add
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "productId": "product_id"
}

Response:
{
  "message": "Item added to wishlist",
  "data": { wishlist object }
}
```

#### 3. Remove from Wishlist
```
DELETE /:userId/remove
Content-Type: application/json

Body:
{
  "productId": "product_id"
}

Response:
{
  "message": "Item removed from wishlist",
  "data": { wishlist object }
}
```

#### 4. Clear Wishlist
```
DELETE /:userId/clear

Response:
{
  "message": "Wishlist cleared",
  "data": { empty wishlist object }
}
```

#### 5. Check Item in Wishlist
```
GET /:userId/check?productId=product_id

Response:
{
  "message": "Check completed",
  "data": {
    "isInWishlist": true/false
  }
}
```

---

### ORDER ENDPOINTS
**Base: `/api/orders`**

#### 1. Create Order
```
POST /create
Content-Type: application/json

Body:
{
  "userId": "user_id",
  "items": [
    {
      "productId": "product_id",
      "name": "Product Name",
      "price": 499,
      "quantity": 2
    }
  ],
  "totalAmount": 998,
  "shippingAddress": {
    "street": "123 Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "paymentMethod": "Credit Card"
}

Response:
{
  "message": "Order created successfully",
  "data": { order object }
}
```

#### 2. Get All Orders
```
GET /all

Response:
{
  "message": "Orders fetched successfully",
  "data": [ { order objects with populated user info } ]
}
```

#### 3. Get Orders by User
```
GET /user/:userId

Response:
{
  "message": "User orders fetched successfully",
  "data": [ { order objects } ]
}
```

#### 4. Get Order by ID
```
GET /:orderId

Response:
{
  "message": "Order fetched successfully",
  "data": { order object with populated product info }
}
```

#### 5. Update Order Status
```
PUT /:orderId/status
Content-Type: application/json

Body:
{
  "status": "processing",
  "paymentStatus": "completed"
}

Response:
{
  "message": "Order status updated",
  "data": { updated order object }
}
```

#### 6. Cancel Order
```
PUT /:orderId/cancel

Response:
{
  "message": "Order cancelled successfully",
  "data": { cancelled order object }
}
```

#### 7. Delete Order
```
DELETE /:orderId

Response:
{
  "message": "Order deleted successfully",
  "data": null
}
```

---

### CONTACT ENDPOINTS
**Base: `/api/contact`**

#### 1. Submit Contact Form
```
POST /createContact
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "I have a question..."
}

Response:
{
  "success": true,
  "message": "Contact submitted successfully",
  "data": { contact object }
}
```

#### 2. Get All Contacts (Admin)
```
GET /allContacts

Response:
{
  "success": true,
  "message": "Contacts fetched successfully",
  "data": [ { contact objects } ]
}
```

#### 3. Update Contact Status (Admin)
```
PUT /updateContact/:contactId
Content-Type: application/json

Body:
{
  "status": "Resolved"
}

Response:
{
  "success": true,
  "message": "Contact updated successfully",
  "data": { updated contact object }
}
```

#### 4. Delete Contact
```
DELETE /deleteContact/:contactId

Response:
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd sweetslice/backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/sweetslice
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key_here
```

### 3. Seed Database with Products
```bash
node seeds/productSeeds.js
```

### 4. Start Backend Server
```bash
npm start
```
or for development with auto-reload:
```bash
npm run dev
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "Error description",
  "error": "Error details",
  "data": null
}
```

Common HTTP Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **404**: Not Found
- **500**: Server Error

---

## Authentication

Some endpoints require JWT token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (default frontend URL)
- Configure via `CLIENT_URL` in `.env`

Allowed Methods: GET, POST, PUT, DELETE
Credentials: Allowed

