
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// POST /cart/:productId
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate product ID
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Check stock
    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // 4. Find logged-in customer
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 5. Find existing cart item
    const existingItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // Increase quantity instead of creating duplicate rows
      if (existingItem.quantity >= product.stock) {
        return res.status(400).json({
          success: false,
          message: "Cannot exceed available stock",
        });
      }

      existingItem.quantity += 1;
    } else {
      // Add a new product with quantity 1
      customer.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    // 6. Save cart in MongoDB
    await customer.save();

    // 7. Return updated cart
    await customer.populate({
      path: "cart.product",
      select: "name price image stock category",
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product to cart",
    });
  }
};

const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .populate({
        path: "cart.product",
        select: "name price image stock category description",
      });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      cart: customer.cart || [],
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load cart",
    });
  }
};


const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate product ID
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Quantity must be a whole number >= 1
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number of at least 1",
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check available stock
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    // Find logged-in customer
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Find the item in their cart
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Update quantity and save
    cartItem.quantity = quantity;
    await customer.save();

    // Return updated cart with product details
    await customer.populate({
      path: "cart.product",
      select: "name price image stock category",
    });

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update cart quantity",
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find logged-in customer
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check whether product is in cart
    const itemExists = customer.cart.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Remove product
    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await customer.save();

    // Return updated cart with product details
    await customer.populate({
      path: "cart.product",
      select: "name price image stock category",
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove product from cart",
    });
  }
};

 module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};