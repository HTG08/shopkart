import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function OrderSuccess() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);

        if (active) {
          setOrder(response.data.order);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to load your order.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [id]);

  const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading order details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h2>Unable to load order</h2>
        <p>{error}</p>
        <Link to="/cart">Back to Cart</Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <p>Order not found.</p>
      </main>
    );
  }

  if (order.paymentStatus !== "PAID") {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h2>Payment Not Confirmed</h2>
        <p>
          This order has not been marked as paid. Please check your payment
          status before retrying.
        </p>
        <Link to="/orders">View My Orders</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "750px",
        margin: "40px auto",
        padding: "30px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>✅ Order Placed Successfully!</h1>
        <p>Your Razorpay test payment was verified.</p>
      </div>

      <hr style={{ margin: "25px 0" }} />

      <h2>Order Details</h2>

      <p>
        <strong>Order ID:</strong> {order._id}
      </p>

      <p>
        <strong>Payment Status:</strong> {order.paymentStatus}
      </p>

      <p>
        <strong>Order Status:</strong> {order.status}
      </p>

      <h3>Items Ordered</h3>

      {order.items?.map((item, index) => (
        <div
          key={`${item.product}-${index}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "15px",
            marginBottom: "12px",
          }}
        >
          <span>
            {item.name} × {item.quantity}
          </span>

          <strong>{formatPrice(item.price * item.quantity)}</strong>
        </div>
      ))}

      <hr />

      <h2>Total: {formatPrice(order.totalAmount)}</h2>

      <h3>Shipping Address</h3>

      <p>
        {order.shippingAddress?.fullName}
        <br />
        {order.shippingAddress?.addressLine1}
        <br />
        {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
        {order.shippingAddress?.pincode}
        <br />
        Phone: {order.shippingAddress?.phone}
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "30px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/orders">View My Orders</Link>
        <Link to="/products">Continue Shopping</Link>
      </div>
    </main>
  );
}

export default OrderSuccess;
