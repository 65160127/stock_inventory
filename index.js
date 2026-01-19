require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/productModel');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('main_menu');
});


app.get('/dashboard', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('index', { products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/data', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('data_management', { products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/report', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.render('monthly_report', { products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/history', (req, res) => {
    res.render('stock_history');
});


app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 MVC Server is running on http://localhost:${PORT}`);
});