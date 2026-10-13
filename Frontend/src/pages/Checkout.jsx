import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    subtotal,
    totalItems,
    cartLoading,
    refreshCart,
    clearCart,
  } = useCart();

  const [address, setAddress] = useState(initialAddress);
  const [errors, setErrors] = useState({});
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    refreshCart().catch(() => {
      setMessage("Unable to load your cart.");
    });
  }, [refreshCart]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(address).forEach((field) => {
      if (!address[field].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (address.phone.trim() && !/^[6-9]\d{9}$/.test(address.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (address.pincode.trim() && !/^\d{6}$/.test(address.pincode.trim())) {
      newErrors.pincode = "Pincode must contain 6 digits";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    if (cartItems.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setPaymentLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      const response = await api.post("/orders/create-payment-order", {
        shippingAddress: address,
      });

      const data = response.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Test Payment",
        order_id: data.razorpayOrderId,

        prefill: {
          name: address.fullName,
          contact: address.phone,
        },

        theme: {
          color: "#2563eb",
        },

        handler: async (paymentResponse) => {
          try {
            setPaymentLoading(true);

            const verification = await api.post("/orders/verify-payment", {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verification.data.success) {
              clearCart();

              navigate(`/order-success/${data.shopKartOrderId}`, {
                replace: true,
              });
            }
          } catch (error) {
            setMessage(
              error.response?.data?.message ||
                "Payment verification failed. Do not retry payment until you check your order status.",
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setMessage("Payment window closed. Your cart is unchanged.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setPaymentLoading(false);

        setMessage(
          response.error?.description ||
            "Payment failed. Your cart is unchanged.",
        );
      });

      razorpay.open();
    } catch (error) {
      setPaymentLoading(false);

      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment.",
      );
    }
  };

  const formatPrice = (price) => `₹${Number(price).toLocaleString("en-IN")}`;

  if (cartLoading) {
    return (
      <div className="checkout-page">
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>{message || "Your cart is empty."}</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout 💳</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handlePayment} noValidate>
          <h2>Shipping Details</h2>

          {[
            ["fullName", "Full Name"],
            ["phone", "Phone Number"],
            ["addressLine1", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
          ].map(([name, label]) => (
            <div className="checkout-field" key={name}>
              <label htmlFor={name}>{label}</label>

              <input
                id={name}
                name={name}
                value={address[name]}
                onChange={handleChange}
                placeholder={`Enter ${label.toLowerCase()}`}
                disabled={paymentLoading}
              />

              {errors[name] && (
                <p className="checkout-field-error">{errors[name]}</p>
              )}
            </div>
          ))}

          {message && (
            <p className="checkout-error" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="checkout-pay-button"
            disabled={paymentLoading}
          >
            {paymentLoading
              ? "Processing..."
              : `Pay ${formatPrice(subtotal)} with Razorpay`}
          </button>

          <p className="checkout-note">
            Razorpay Test Mode only. No real payment.
          </p>
        </form>

        <div className="checkout-summary">
          <h2>Order Summary</h2>

          {cartItems.map((item) => (
            <div
              className="checkout-summary-item"
              key={item.product?._id || item._id}
            >
              <span>
                {item.product?.name || "Product"} × {item.quantity}
              </span>

              <strong>
                {formatPrice((item.product?.price || 0) * item.quantity)}
              </strong>
            </div>
          ))}

          <hr />

          <div className="checkout-summary-item">
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="checkout-summary-total">
            <span>Total</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <Link to="/cart">← Back to Cart</Link>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
