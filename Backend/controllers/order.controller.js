
const mongoose = require("mongoose");
const crypto = require("crypto");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const getRazorpayInstance = require("../config/razorpay");

// Validate shipping address
function validateShippingAddress(address) {
  if (!address || typeof address !== "object") {
    return "Shipping address is required";
  }

  const fields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of fields) {
    if (
      typeof address[field] !== "string" ||
      !address[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
    return "Enter a valid 10-digit Indian phone number";
  }

  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Pincode must contain exactly 6 digits";
  }

  return null;
}

// POST /orders/create-payment-order
const createPaymentOrder = async (req, res) => {
  try {
    const validationError = validateShippingAddress(
      req.body.shippingAddress
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Fetch latest product data and verify stock
    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart no longer exists",
        });
      }

      const quantity = cartItem.quantity;

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      if (
        typeof product.price !== "number" ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image || "",
      });

      totalAmount += product.price * quantity;
    }

    // Razorpay requires amount in paise
    const amountInPaise = Math.round(totalAmount * 100);

    if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const shippingAddress = {};

    for (const field of [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "pincode",
    ]) {
      shippingAddress[field] =
        req.body.shippingAddress[field].trim();
    }

    // Create pending ShopKart order
    const order = await Order.create({
      user: customer._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    let razorpayOrder;

    try {
      const razorpay = getRazorpayInstance();

      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order._id.toString(),
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    } catch (paymentError) {
      console.error("Razorpay order error:", paymentError);

      // This order never reached a usable payment state.
      // Remove it rather than leaving an unusable pending order.
      await Order.deleteOne({
        _id: order._id,
        paymentStatus: "PENDING",
        razorpayOrderId: "",
      }).catch(() => {});

      return res.status(502).json({
        success: false,
        message: "Unable to initialize Razorpay payment",
      });
    }

    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
};

// POST /orders/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(shopKartOrderId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid payment details are required",
      });
    }

    const order = await Order.findOne({
      _id: shopKartOrderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID mismatch",
      });
    }

    // Verify signature using the trusted order ID from MongoDB
    const signatureBody =
      order.razorpayOrderId + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    );

    const receivedBuffer = Buffer.from(
      String(razorpay_signature),
      "hex"
    );

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Verify payment status with Razorpay as well
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== order.razorpayOrderId ||
      payment.status !== "captured" ||
      payment.amount !== Math.round(order.totalAmount * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has not been successfully captured",
      });
    }

    // Mark payment as successful
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;

    await order.save();

    // Clear cart only after payment verification
    const customer = await Customer.findById(req.user._id);

    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.json({
      success: true,
      message: "Payment verified and order placed",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
};

// GET /orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders",
    });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load order details",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
};
