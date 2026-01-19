const Product = require('../models/productModel');
const xlsx = require('xlsx');

exports.importExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'กรุณาแนบไฟล์ Excel' });
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        for (const item of data) {
            const inAmt = parseInt(item.STOCK_IN) || 0;
            const outAmt = parseInt(item.STOCK_OUT) || 0;
            const netChange = inAmt - outAmt;
            if (netChange !== 0 || item.BOX_LIST) {
                await Product.incrementStock({
                    BOX_LIST: item.BOX_LIST, SUPP_CODE: item.SUPP_CODE,
                    STOCK: netChange, MIN_STOCK: item.MIN_STOCK,
                    MAX_STOCK: item.MAX_STOCK, Process: item.Process
                });
                if (inAmt > 0) await Product.logHistory(item.BOX_LIST, 'in', inAmt);
                if (outAmt > 0) await Product.logHistory(item.BOX_LIST, 'out', outAmt);
            }
        }
        res.send(`<script>alert('นำเข้าและคำนวณยอดสำเร็จ');window.location.href = '/';</script>`);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateProducts = async (req, res) => {
    try {
        const { updates } = req.body;
        await Product.updateStock(updates);
        for (const item of updates) {
            const type = item.change_type === 'use' ? 'out' : 'in';
            await Product.logHistory(item.box_list, type, item.amount);
        }
        res.json({ message: '✅ Updated successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUsageReport = async (req, res) => {
    try { res.json(await Product.getUsageReport(req.query.month)); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getProducts = async (req, res) => {
    try { res.json(await Product.getAll()); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteProduct = async (req, res) => {
    try { await Product.delete(req.params.id); res.json({ message: 'ลบข้อมูลสำเร็จ' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
};

exports.editProduct = async (req, res) => {
    try { await Product.updateInfo(req.body); res.json({ message: '✅ แก้ไขข้อมูลสำเร็จ' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
};