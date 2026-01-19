const Product = require('../models/productModel');
const xlsx = require('xlsx');

exports.importExcel = async (req, res) => {
    const client = await Product.getClient();
    try {
        if (!req.file) return res.status(400).json({ error: 'กรุณาแนบไฟล์ Excel' });
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        await client.query('BEGIN');

        for (const item of data) {
            const inAmt = parseInt(item.STOCK_IN) || 0;
            const outAmt = parseInt(item.STOCK_OUT) || 0;
            const netChange = inAmt - outAmt;

            if (netChange !== 0 || item.BOX_LIST) {

                await Product.incrementStock({
                    BOX_LIST: item.BOX_LIST, 
                    SUPP_CODE: item.SUPP_CODE,
                    STOCK: netChange, 
                    MIN_STOCK: parseInt(item.MIN_STOCK) || 0,
                    MAX_STOCK: parseInt(item.MAX_STOCK) || 0,
                    Process: item.Process
                }, client);


                if (inAmt > 0) await Product.logHistory(item.BOX_LIST, 'in', inAmt, client);
                if (outAmt > 0) await Product.logHistory(item.BOX_LIST, 'out', outAmt, client);
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'นำเข้าข้อมูลสำเร็จ' });
    } catch (err) { 
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.updateProducts = async (req, res) => {
    const client = await Product.getClient();
    try {
        const { updates } = req.body;
        await client.query('BEGIN');

        await Product.updateStock(updates, client); 

        for (const item of updates) {
            const type = item.change_type === 'use' ? 'out' : 'in';
            await Product.logHistory(item.box_list, type, item.amount, client); 
        }

        await client.query('COMMIT');
        res.json({ message: '✅ Updated successfully' });
    } catch (err) { 
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.getUsageReport = async (req, res) => {
    try { 
        res.json(await Product.getUsageReport(req.query.month)); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.getProducts = async (req, res) => {
    try { 
        res.json(await Product.getAll()); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.deleteProduct = async (req, res) => {
    try { 
        await Product.delete(req.params.id); 
        res.json({ message: 'ลบข้อมูลสำเร็จ' }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.editProduct = async (req, res) => {
    try { 
        await Product.updateInfo(req.body); 
        res.json({ message: '✅ แก้ไขข้อมูลสำเร็จ' }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

exports.getHistoryPage = async (req, res) => {
    try {
        const history = await Product.getHistory();
        res.render('stock_history', { history });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getHistoryData = async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        const limit = 15; // กำหนดค่าคงที่ 15 รายการ
        const offset = parseInt(req.query.offset) || 0; // รับค่าจุดเริ่มจาก Frontend
        
        const history = await Product.getHistoryFiltered(filter, limit, offset);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};