require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/productModel');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    try {
        const Product = require('./models/productModel');
        const products = await Product.getAll();
        res.render('index', { products: products });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/data', async (req, res) => {
    try {
        const Product = require('./models/productModel'); // เรียกใช้ Model
        const products = await Product.getAll(); // ดึงข้อมูลทั้งหมด
        res.render('data_management', { products: products }); // ชื่อไฟล์ ejs ที่คุณสร้าง
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// เรียกใช้ Routes
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 MVC Server is running on http://localhost:${PORT}`);
});