const pool = require('../config/db');

const Product = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM products ORDER BY box_list ASC');
        return result.rows;
    },
    updateStock: async (updates) => {
        const query = `
            UPDATE products AS p
            SET stock = v.new_stock::int, min_stock = v.new_min::int
            FROM (VALUES ${updates.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',')}) 
            AS v(box_list, new_stock, new_min)
            WHERE p.box_list = v.box_list::varchar`;
        const values = updates.flatMap(u => [u.box_list, u.new_stock, u.new_min]);
        return await pool.query(query, values);
    },
    incrementStock: async (item) => {
        const query = `
            INSERT INTO products (box_list, supp_code, stock, min_stock, max_stock, "process")
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (box_list) DO UPDATE 
            SET stock = products.stock + EXCLUDED.stock,
                supp_code = EXCLUDED.supp_code,
                min_stock = EXCLUDED.min_stock,
                max_stock = EXCLUDED.max_stock,
                "process" = EXCLUDED."process";`;
        const values = [item.BOX_LIST, item.SUPP_CODE, item.STOCK || 0, item.MIN_STOCK || 0, item.MAX_STOCK || 0, item.Process || '-'];
        return await pool.query(query, values);
    },
    logHistory: async (box_list, type, amount) => {
        return await pool.query('INSERT INTO stock_history (box_list, type, amount) VALUES ($1, $2, $3)', [box_list, type, amount]);
    },
    getUsageReport: async (month) => {
        const query = `
            SELECT box_list, SUM(amount) as total_usage 
            FROM stock_history 
            WHERE type = 'out' AND TO_CHAR(created_at, 'YYYY-MM') = $1
            GROUP BY box_list ORDER BY total_usage DESC`;
        const result = await pool.query(query, [month]);
        return result.rows;
    },
    delete: async (id) => {
        return await pool.query('DELETE FROM products WHERE box_list = $1', [id]);
    },
    updateInfo: async (data) => {
        const { box_list, supp_code, min_stock, max_stock, process } = data;
        const query = `UPDATE products SET supp_code = $1, min_stock = $2, max_stock = $3, "process" = $4 WHERE box_list = $5`;
        const values = [supp_code, min_stock, max_stock, process, box_list];
        return await pool.query(query, values);
    }
};

module.exports = Product;