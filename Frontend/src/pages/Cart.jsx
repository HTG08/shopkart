import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartLoading,
    cartError,
    totalItems,
    subtotal,
    refreshCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  // Load saved cart from MongoDB
  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  // Increase or decrease product quantity
  const changeQuantity = async (productId, quantity) => {
    setBusyId(productId);
    setActionError("");

    try {
      await updateQuantity(productId, quantity);
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Unable to update quantity.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // Remove product from cart
  const removeItem = async (productId) => {
    setBusyId(productId);
    setActionError("");

    try {
      await removeFromCart(productId);
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Unable to remove product.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // Navigate to Lab 06 checkout
  const handleCheckout = () => {
    if (cartItems.length === 0 || busyId !== null) {
      return;
    }

    navigate("/checkout");
  };

  const formatPrice = (price) => `₹${Number(price).toLocaleString("en-IN")}`;

  if (cartLoading) {
    return (
      <main className="cart-page">
        <h1>My Cart 🛒</h1>
        <p>Loading your cart...</p>
      </main>
    );
  }

  if (cartError && cartItems.length === 0) {
    return (
      <main className="cart-page">
        <h1>My Cart 🛒</h1>

        <p className="cart-error">{cartError}</p>

        <button
          type="button"
          className="cart-primary-btn"
          onClick={() => refreshCart().catch(() => {})}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <h1>My Cart 🛒</h1>

      {actionError && <p className="cart-error">{actionError}</p>}

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h2>Your cart is empty 🛒</h2>

          <p>Looks like you haven't added anything yet.</p>

          <Link to="/products" className="cart-primary-btn">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart products */}
          <section className="cart-items">
            {cartItems.map((item) => {
              const product = item.product;

              if (!product) return null;

              const isBusy = busyId === product._id;
              const canIncrease = item.quantity < product.stock;

              return (
                <article className="cart-item" key={product._id}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-details">
                    <h3>{product.name}</h3>

                    <p className="cart-item-category">{product.category}</p>

                    <p className="cart-item-price">
                      {formatPrice(product.price)} each
                    </p>

                    {/* Quantity controls */}
                    <div className="cart-quantity">
                      <button
                        type="button"
                        disabled={busyId !== null || item.quantity <= 1}
                        onClick={() =>
                          changeQuantity(product._id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        disabled={busyId !== null || !canIncrease}
                        onClick={() =>
                          changeQuantity(product._id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    {/* Remove product */}
                    <button
                      type="button"
                      className="cart-remove-btn"
                      disabled={busyId !== null}
                      onClick={() => removeItem(product._id)}
                    >
                      {isBusy ? "Updating..." : "Remove"}
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {formatPrice(product.price * item.quantity)}
                  </div>
                </article>
              );
            })}
          </section>

          {/* Order summary */}
          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Total Items</span>
              <strong>{totalItems}</strong>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <hr />

            <div className="cart-summary-row cart-grand-total">
              <span>Total</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            {/* Working checkout button */}
            <button
              type="button"
              className="cart-primary-btn"
              onClick={handleCheckout}
              disabled={
                cartItems.length === 0 || busyId !== null || cartLoading
              }
            >
              Proceed to Checkout →
            </button>

            <p className="cart-checkout-note">
              Secure checkout powered by Razorpay Test Mode.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;
