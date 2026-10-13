
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product.model");

async function fixImage() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const result = await Product.updateOne(
            { name: "Mechanical Keyboard" },
            {
                $set: {
                    image: "https://placehold.co/400x300?text=Mechanical+Keyboard"
                }
            }
        );

        console.log("Products updated:", result.modifiedCount);
    } catch (error) {
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixImage();
