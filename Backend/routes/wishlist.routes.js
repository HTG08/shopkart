
const express = require("express");

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All wishlist routes require login
router.use(authMiddleware);

// Get logged-in customer's wishlist
router.get("/", getWishlist);

// Add a product to wishlist
router.post("/:productId", addToWishlist);

// Remove a product from wishlist
router.delete("/:productId", removeFromWishlist);

module.exports = router;
