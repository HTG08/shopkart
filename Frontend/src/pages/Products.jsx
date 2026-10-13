import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import "./Products.css";

function Products() {
  // Product states
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wishlist states
  const [wishlistIds, setWishlistIds] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [wishlistError, setWishlistError] = useState("");

  // Cart states
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState(null);
  const [cartError, setCartError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  // Load products when search or category changes
  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/products", {
          params: { search, category },
        });

        if (active) {
          setProducts(response.data.products || []);
        }
      } catch (err) {
        if (active) {
          setError("Failed to load products.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [search, category]);

  // Load saved wishlist
  useEffect(() => {
    let active = true;

    const fetchWishlist = async () => {
      try {
        const response = await api.get("/wishlist");

        if (active) {
          const ids = (response.data.wishlist || []).map(
            (product) => product._id,
          );

          setWishlistIds(ids);
        }
      } catch (err) {
        if (active) {
          setWishlistError("Unable to load wishlist status.");
        }
      }
    };

    fetchWishlist();

    return () => {
      active = false;
    };
  }, []);

  // Add product to wishlist
  const handleAddToWishlist = async (productId) => {
    if (savingId !== null || wishlistIds.includes(productId)) {
      return;
    }

    setSavingId(productId);
    setWishlistError("");

    try {
      await api.post(`/wishlist/${productId}`);

      setWishlistIds((previous) =>
        previous.includes(productId) ? previous : [...previous, productId],
      );
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlistIds((previous) =>
          previous.includes(productId) ? previous : [...previous, productId],
        );
      } else {
        setWishlistError(
          err.response?.data?.message || "Failed to add product to wishlist.",
        );
      }
    } finally {
      setSavingId(null);
    }
  };

  // Add product to cart
  const handleAddToCart = async (productId) => {
    if (addingId !== null) return;

    setAddingId(productId);
    setCartError("");
    setCartMessage("");

    try {
      await addToCart(productId);
      setCartMessage("✅ Product added to cart!");
    } catch (err) {
      setCartError(
        err.response?.data?.message || "Unable to add product to cart.",
      );
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="products-page">
      <h1 className="products-title">ShopKart Products 🛒</h1>

      {/* Search and category filters */}
      <div className="products-filters">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
          <option value="Home">Home</option>
          <option value="Books">Books</option>
        </select>
      </div>

      {/* Error and success messages */}
      {wishlistError && (
        <p style={{ color: "#dc2626", marginBottom: "12px" }}>
          {wishlistError}
        </p>
      )}

      {cartError && (
        <p style={{ color: "#dc2626", marginBottom: "12px" }}>{cartError}</p>
      )}

      {cartMessage && (
        <p role="status" style={{ color: "#16a34a", marginBottom: "12px" }}>
          {cartMessage} <Link to="/cart">View Cart →</Link>
        </p>
      )}

      {/* Product listing */}
      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p style={{ color: "#dc2626" }}>{error}</p>
      ) : products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => {
            const isSaved = wishlistIds.includes(product._id);
            const isSaving = savingId === product._id;
            const isAdding = addingId === product._id;
            const isOutOfStock = product.stock <= 0;

            return (
              <div className="product-card" key={product._id}>
                {/* Product image */}
                <img
                  className="product-image"
                  src={product.image}
                  alt={product.name}
                />

                {/* Product information */}
                <h3>{product.name}</h3>

                <p className="product-category">{product.category}</p>

                <p className="product-price">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <p className="product-stock">
                  {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
                </p>

                {/* View product details */}
                <Link
                  className="product-button"
                  to={`/products/${product._id}`}
                >
                  View Details
                </Link>

                {/* Wishlist button */}
                <button
                  type="button"
                  className={`wishlist-button ${
                    isSaved ? "wishlist-saved" : ""
                  }`}
                  onClick={() => handleAddToWishlist(product._id)}
                  disabled={isSaved || savingId !== null}
                >
                  {isSaving
                    ? "⏳ Saving..."
                    : isSaved
                      ? "♥ Added to Wishlist"
                      : "♡ Add to Wishlist"}
                </button>

                {/* Cart button */}
                <button
                  type="button"
                  className="cart-add-button"
                  onClick={() => handleAddToCart(product._id)}
                  disabled={isOutOfStock || addingId !== null}
                >
                  {isAdding
                    ? "⏳ Adding..."
                    : isOutOfStock
                      ? "Out of Stock"
                      : "🛒 Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
