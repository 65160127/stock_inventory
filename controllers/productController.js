const Product = require('../models/productModel');
const xlsx = require('xlsx');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.importExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'กรุณาแนบไฟล์ Excel' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const item of data) {
            await Product.upsert(item);
        }

        res.send(`
    <script>
        alert('นำเข้าข้อมูลสำเร็จ ${data.length} รายการ');
        window.location.href = '/';
    </script>
`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProducts = async (req, res) => {
    try {
        await Product.updateStock(req.body.updates);
        res.json({ message: '✅ Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = require('../config/db');
        await pool.query('DELETE FROM products WHERE box_list = $1', [id]);
        res.json({ message: 'ลบข้อมูลสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.editProduct = async (req, res) => {
    try {
        const { box_list, supp_code, min_stock, max_stock, process } = req.body;
        const pool = require('../config/db');
        
        const query = `
            UPDATE products 
            SET supp_code = $1, min_stock = $2, max_stock = $3, "process" = $4 
            WHERE box_list = $5
        `;
        const values = [supp_code, min_stock, max_stock, process, box_list];
        
        await pool.query(query, values);
        res.json({ message: '✅ แก้ไขข้อมูลสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};