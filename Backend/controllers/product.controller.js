
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            image,
            stock
        } = req.body;

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock
        });

        res.status(201).json({
            success: true,
            product: product
        });

    } catch (error) {
        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};



const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        const filter = {};

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        if (category) {
            filter.category = category;
        }

        const products = await Product.find(filter);

        res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};



const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product: product
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById
};