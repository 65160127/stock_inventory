require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/productModel');

const app = express();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---

// Dashboard View
app.get('/', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('index', { products: products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Data Management View
app.get('/data', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('data_management', { products: products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Monthly Report View
app.get('/report', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('monthly_report', { products: products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// API Routes
app.use('/api/products', productRoutes);

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 MVC Server is running on http://localhost:${PORT}`);
});