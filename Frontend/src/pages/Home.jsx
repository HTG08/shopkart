import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/customers/me");

        setUser(response.data.customer);
      } catch (error) {
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome to ShopKart 🛒</h1>

        <h2>Hello, {user.fullName}!</h2>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
      </div>
    </div>
  );
}

export default Home;
