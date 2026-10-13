
const express = require("express");

const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Protect all cart routes
router.use(authMiddleware);

// Get current customer's cart
router.get("/", getCart);

// Add product or increase quantity
router.post("/:productId", addToCart);

// Update product quantity
router.patch("/:productId", updateCartQuantity);

// Remove product from cart
router.delete("/:productId", removeFromCart);

module.exports = router;
