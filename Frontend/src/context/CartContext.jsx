import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import api from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  // Load cart from MongoDB
  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    setCartError("");

    try {
      const response = await api.get("/cart");
      setCartItems(response.data.cart || []);
    } catch (error) {
      setCartError("Unable to load your cart.");
      throw error;
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Add product or increase quantity
  const addToCart = async (productId) => {
    setCartError("");

    try {
      const response = await api.post(`/cart/${productId}`);
      setCartItems(response.data.cart || []);
      return response.data;
    } catch (error) {
      setCartError(error.response?.data?.message || "Unable to add product.");
      throw error;
    }
  };

  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    setCartError("");

    try {
      const response = await api.patch(`/cart/${productId}`, {
        quantity,
      });
      setCartItems(response.data.cart || []);
      return response.data;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Unable to update quantity.",
      );
      throw error;
    }
  };

  // Remove product
  const removeFromCart = async (productId) => {
    setCartError("");

    try {
      const response = await api.delete(`/cart/${productId}`);
      setCartItems(response.data.cart || []);
      return response.data;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Unable to remove product.",
      );
      throw error;
    }
  };

  // Clear local cart state when logging out
  const clearCart = () => {
    setCartItems([]);
    setCartError("");
  };

  // Derived values: never store these in MongoDB
  const totalItems = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (item.product?.price || 0) * item.quantity,
        0,
      ),
    [cartItems],
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartLoading,
        cartError,
        totalItems,
        subtotal,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
