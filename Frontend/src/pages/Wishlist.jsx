import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Wishlist.css";
function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/wishlist");
      setProducts(response.data.wishlist);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError("Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeProduct = async (productId) => {
    try {
      setError("");
      await api.delete(`/wishlist/${productId}`);

      setProducts((previous) =>
        previous.filter((product) => product._id !== productId),
      );
    } catch (err) {
      setError("Failed to remove product.");
    }
  };

  if (loading) {
    return <p className="wishlist-message">Loading wishlist...</p>;
  }

  return (
    <main className="wishlist-page">
      <h1>My Wishlist ❤️</h1>
      <p>Your favorite ShopKart products, saved in one place.</p>

      {error && <p className="wishlist-error">{error}</p>}

      {products.length === 0 ? (
        <div className="wishlist-empty">
          <h2>Your wishlist is empty 💔</h2>
          <p>Explore products and save something you love!</p>
          <Link to="/products">Browse Products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {products.map((product) => (
            <div className="wishlist-card" key={product._id}>
              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />

              <h3>{product.name}</h3>
              <p>{product.category}</p>
              <h3 className="wishlist-price">₹{product.price}</h3>

              <div className="wishlist-actions">
                <Link to={`/products/${product._id}`}>View Details</Link>

                <button onClick={() => removeProduct(product._id)}>
                  Remove ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Wishlist;
