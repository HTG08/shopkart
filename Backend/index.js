const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");


const cors = require("cors");

require("dotenv").config();

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/customers", customerRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ShopKart backend is running"
    });
});

const startServer = async () => {
    try {
        console.log("PORT:", process.env.PORT);
        console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded" : "Missing");

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.log("MongoDB connection failed:", error.message);
    }
};

startServer();