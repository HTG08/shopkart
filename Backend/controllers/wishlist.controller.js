
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// ADD PRODUCT TO WISHLIST
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.wishlist.some(id => id.equals(productId))) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to add product to wishlist",
    });
  }
};

// GET LOGGED-IN CUSTOMER'S WISHLIST
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id)
      .populate({
        path: "wishlist",
        select: "name price category image stock description",
      });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    const wishlist = customer.wishlist.filter(Boolean);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load wishlist",
    });
  }
};

// REMOVE PRODUCT FROM WISHLIST
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    const exists = customer.wishlist.some(id =>
      id.equals(productId)
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    customer.wishlist = customer.wishlist.filter(
      id => !id.equals(productId)
    );

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to remove product from wishlist",
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
