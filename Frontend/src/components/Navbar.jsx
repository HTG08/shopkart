import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const { totalItems, refreshCart, clearCart } = useCart();

  // Load saved cart when Navbar mounts
  useEffect(() => {
    refreshCart().catch(() => {});
  }, [refreshCart]);

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");

      // Clear cart data belonging to the previous user
      clearCart();

      navigate("/login", { replace: true });
    } catch (error) {
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <nav className="navbar">
      <h2>ShopKart 🛒</h2>

      <div className="nav-right">
        <div className="nav-links">
          <Link to="/home">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/wishlist">❤️ Wishlist</Link>

          <Link to="/cart">🛒 Cart ({totalItems})</Link>
          <Link to="/orders">My Orders 📦</Link>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
