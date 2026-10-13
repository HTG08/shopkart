import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");

        if (active) {
          setOrders(response.data.orders || []);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to load orders.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, []);

  const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <main className="orders-page">
        <h1>My Orders 📦</h1>
        <p>Loading your orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="orders-page">
        <h1>My Orders 📦</h1>
        <p className="orders-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <h1>My Orders 📦</h1>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <h2>No orders yet</h2>
          <p>Your orders will appear here after checkout.</p>
          <Link to="/products">Start Shopping →</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="orders-card" key={order._id}>
              <div className="orders-card-header">
                <div>
                  <p className="orders-muted">{formatDate(order.createdAt)}</p>
                  <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                </div>

                <span
                  className={
                    order.paymentStatus === "PAID"
                      ? "orders-status paid"
                      : order.paymentStatus === "FAILED"
                        ? "orders-status failed"
                        : "orders-status pending"
                  }
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="orders-products">
                {order.items?.map((item, index) => (
                  <div
                    className="orders-product"
                    key={`${item.product}-${index}`}
                  >
                    {item.image && <img src={item.image} alt={item.name} />}

                    <div>
                      <strong>{item.name}</strong>
                      <p className="orders-muted">Qty: {item.quantity}</p>
                    </div>

                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div className="orders-card-footer">
                <div>
                  <p className="orders-muted">Status: {order.status}</p>
                  <strong>Total: {formatPrice(order.totalAmount)}</strong>
                </div>

                {order.paymentStatus === "PAID" && (
                  <Link to={`/order-success/${order._id}`}>View Details →</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Orders;
