import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Global cart state
  const { addToCart } = useCart();

  // Product states
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wishlist states
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  // Cart states
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  // Load product details and wishlist
  useEffect(() => {
    let active = true;

    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const [productResponse, wishlistResponse] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/wishlist"),
        ]);

        if (!active) return;

        setProduct(productResponse.data.product);

        const savedProducts = wishlistResponse.data.wishlist || [];

        setIsWishlisted(savedProducts.some((item) => item._id === id));
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          navigate("/login", { replace: true });
        } else {
          setError("Unable to load product details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      active = false;
    };
  }, [id, navigate]);

  // Add product to cart
  const handleAddToCart = async () => {
    if (addingToCart) return;

    setAddingToCart(true);
    setCartMessage("");

    try {
      await addToCart(id);
      setCartMessage("✅ Product added to cart!");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setCartMessage(
          err.response?.data?.message || "Failed to add product to cart.",
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Add product to wishlist
  const handleAddToWishlist = async () => {
    if (wishlistLoading || isWishlisted) return;

    setWishlistLoading(true);
    setWishlistError("");

    try {
      await api.post(`/wishlist/${id}`);
      setIsWishlisted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setIsWishlisted(true);
      } else if (err.response?.status === 401) {
        navigate("/login", { replace: true });
      } else {
        setWishlistError(
          err.response?.data?.message || "Unable to save product.",
        );
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "30px" }}>Loading product...</p>;
  }

  if (error) {
    return <p style={{ padding: "30px", color: "red" }}>{error}</p>;
  }

  if (!product) {
    return <p style={{ padding: "30px" }}>Product not found.</p>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <Link to="/products">← Back to Products</Link>

      <div
        style={{
          background: "white",
          maxWidth: "750px",
          margin: "30px auto",
          padding: "30px",
          borderRadius: "14px",
          textAlign: "center",
          boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%",
            height: "260px",
            objectFit: "contain",
            borderRadius: "10px",
          }}
        />

        <h1>{product.name}</h1>

        <p>{product.description}</p>

        <p>
          <strong>Category:</strong> {product.category}
        </p>

        <h2 style={{ color: "#2563eb" }}>
          ₹{product.price.toLocaleString("en-IN")}
        </h2>

        <p>
          <strong>Stock:</strong>{" "}
          {product.stock > 0 ? `${product.stock} available` : "Out of Stock"}
        </p>

        {/* Cart and Wishlist buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            disabled={product.stock === 0 || addingToCart}
            onClick={handleAddToCart}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              opacity: product.stock === 0 || addingToCart ? 0.6 : 1,
            }}
          >
            {addingToCart ? "⏳ Adding..." : "🛒 Add to Cart"}
          </button>

          <button
            type="button"
            disabled={wishlistLoading || isWishlisted}
            onClick={handleAddToWishlist}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: isWishlisted ? "#16a34a" : "#e11d48",
              color: "white",
              cursor: "pointer",
            }}
          >
            {wishlistLoading
              ? "⏳ Saving..."
              : isWishlisted
                ? "♥ Added to Wishlist"
                : "♡ Add to Wishlist"}
          </button>
        </div>

        {/* Cart feedback */}
        {cartMessage && (
          <p style={{ marginTop: "16px", fontWeight: "600" }}>{cartMessage}</p>
        )}

        {/* Wishlist feedback */}
        {wishlistError && (
          <p style={{ color: "#dc2626", marginTop: "15px" }}>{wishlistError}</p>
        )}

        {/* Navigation links */}
        <div
          style={{
            marginTop: "22px",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
          }}
        >
          <Link to="/cart">View Cart 🛒</Link>

          {isWishlisted && <Link to="/wishlist">View My Wishlist ❤️</Link>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
