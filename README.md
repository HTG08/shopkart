# shopkart
# 🛒 ShopKart | Full-Stack MERN E-Commerce Application

ShopKart is a full-stack e-commerce web application built using the **MERN stack (MongoDB, Express.js, React.js, and Node.js)**.

It provides a complete online shopping experience, including customer authentication, product browsing, wishlist management, shopping cart functionality, secure checkout, Razorpay Test Mode payment integration, and order history.

The application uses RESTful APIs, MongoDB for data persistence, and JWT-based authentication.

## Features

### Customer Authentication
- Customer registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- HTTP-only cookies for session management
- Protected API routes
- Customer logout

### Product Management
- Browse available products
- View individual product details
- Search products
- Filter products by category
- Display product prices, images, and stock availability

### Wishlist
- Add products to wishlist
- Remove products from wishlist
- View saved wishlist products
- Store wishlist data in MongoDB

### Shopping Cart
- Add products to cart
- Increase or decrease quantities
- Remove products
- Automatic subtotal calculation
- Stock-aware quantity controls
- Persistent cart storage in MongoDB
- Dynamic cart item count in the navbar

### Checkout and Payments
- Shipping address form with input validation
- Order summary before payment
- Razorpay Standard Checkout integration
- Razorpay Test Mode payments
- Server-side order amount calculation
- HMAC SHA256 payment signature verification
- Order creation and payment status tracking
- Cart clearing only after successful payment verification

### Order Management
- Create orders with product and price snapshots
- View order history
- View individual order details
- Track payment status (`PENDING`, `PAID`, `FAILED`)
- Track order status (`PENDING_PAYMENT`, `PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`)
- Restrict order access to the authenticated customer

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, React Router, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt, HTTP-only cookies |
| API Communication | Axios |
| Payments | Razorpay Test Mode |
| Development Tools | VS Code, Git, GitHub |

## Project Structure

```text
ShopKart/
├── Backend/
│   ├── config/
│   │   └── razorpay.js
│   ├── controllers/
│   │   ├── customer.controller.js
│   │   ├── product.controller.js
│   │   ├── wishlist.controller.js
│   │   ├── cart.controller.js
│   │   └── order.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── customer.model.js
│   │   ├── product.model.js
│   │   └── order.model.js
│   ├── routes/
│   │   ├── customer.routes.js
│   │   ├── product.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── cart.routes.js
│   │   └── order.routes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── index.js
│   └── package.json
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation and Setup

### Prerequisites

Ensure you have installed:

- Node.js and npm
- MongoDB Atlas account or a MongoDB database
- Razorpay account with Test Mode API keys
- Git

### 1. Clone the repository

```bash
git clone https://github.com/HTG08/shopkart.git
cd shopkart
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/` and configure:

```env
PORT=8888
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

**Important:** Match the MongoDB connection string variable name to the one used in `Backend/index.js`.

Never commit your `.env` file or expose your Razorpay secret key.

Start the backend:

```bash
npm run dev
```

The backend runs at:

`http://localhost:8888`

### 3. Frontend setup

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/customers/register` | Register customer |
| POST | `/customers/login` | Login customer |
| POST | `/customers/logout` | Logout customer |
| GET | `/customers/me` | Get logged-in customer |

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Retrieve products |
| GET | `/products/:id` | Retrieve product details |

### Wishlist

| Method | Endpoint | Description |
|---|---|---|
| GET | `/wishlist` | View wishlist |
| POST | `/wishlist/:productId` | Add product |
| DELETE | `/wishlist/:productId` | Remove product |

### Cart

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | View cart |
| POST | `/cart/:productId` | Add product |
| PATCH | `/cart/:productId` | Update quantity |
| DELETE | `/cart/:productId` | Remove product |

### Orders and Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/create-payment-order` | Create pending order and Razorpay order |
| POST | `/orders/verify-payment` | Verify payment signature and payment status |
| GET | `/orders` | View authenticated customer's orders |
| GET | `/orders/:id` | View an individual order |

## Security

ShopKart implements several security measures:

- Passwords are hashed before storage.
- JWT authentication protects customer-specific endpoints.
- HTTP-only cookies reduce direct JavaScript access to authentication tokens.
- Razorpay secret keys remain on the backend.
- Payment amounts are calculated on the server instead of trusting frontend values.
- Razorpay payment signatures are verified using HMAC SHA256.
- Order records are accessible only to their owners.
- Cart data is cleared only after successful payment verification.

## Payment Workflow

1. The customer adds products to the cart.
2. The customer enters shipping details at checkout.
3. The backend validates the cart, product stock, and shipping information.
4. The backend creates a pending order in MongoDB.
5. The backend creates a Razorpay Test Mode payment order.
6. Razorpay Checkout processes the simulated payment.
7. The frontend sends payment details to the backend.
8. The backend verifies the Razorpay signature and payment details.
9. The order is updated to `PAID` and `PLACED`.
10. The customer's cart is cleared.
11. The customer is redirected to the order confirmation page.

## 🧪 Testing

The following primary workflows have been manually tested:

- Customer authentication
- Product browsing
- Wishlist operations
- Cart quantity updates and product removal
- Checkout form and order summary
- Razorpay Test Mode Netbanking payment
- Successful backend payment verification
- Order creation and retrieval
- Order history display
- Cart clearing after successful payment

**Payment integration is configured for Razorpay Test Mode. No real payments are processed.**

## Future Improvements

- Admin dashboard for managing products and orders
- Order cancellation and refunds
- Automatic handling of abandoned payment attempts
- Product ratings and reviews
- Improved stock management after payment
- Email order confirmations
- Responsive UI enhancements
- Production deployment and monitoring

## Project Information

**Project:** ShopKart  
**Type:** Full-Stack MERN E-Commerce Application  
**Repository:** https://github.com/HTG08/shopkart  
**Payment Gateway:** Razorpay (Test Mode)

Built as a practical full-stack engineering project demonstrating authentication, REST API development, database integration, state management, and payment processing.
