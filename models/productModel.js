const pool = require('../config/db');

const Product = {
    getClient: async () => {
        return await pool.connect();
    },

    getAll: async (limit = 50, offset = 0) => {
        const result = await pool.query(
            'SELECT * FROM products ORDER BY box_list ASC LIMIT $1 OFFSET $2', 
            [limit, offset]
        );
        return result.rows;
    },

    updateStock: async (updates, client = pool) => {
        const query = `
            UPDATE products AS p
            SET stock = v.new_stock::int, min_stock = v.new_min::int
            FROM (VALUES ${updates.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',')}) 
            AS v(box_list, new_stock, new_min)
            WHERE p.box_list = v.box_list::varchar`;
        const values = updates.flatMap(u => [u.box_list, u.new_stock, u.new_min]);
        return await client.query(query, values);
    },

    incrementStock: async (item, client = pool) => {
        const query = `
            INSERT INTO products (box_list, supp_code, stock, min_stock, max_stock, "process")
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (box_list) DO UPDATE 
            SET 
                stock = products.stock + EXCLUDED.stock,
                supp_code = COALESCE(NULLIF(EXCLUDED.supp_code, '-'), products.supp_code),
                min_stock = CASE WHEN EXCLUDED.min_stock > 0 THEN EXCLUDED.min_stock ELSE products.min_stock END,
                max_stock = CASE WHEN EXCLUDED.max_stock > 0 THEN EXCLUDED.max_stock ELSE products.max_stock END,
                "process" = COALESCE(NULLIF(EXCLUDED."process", '-'), products."process"),
                updated_at = CURRENT_TIMESTAMP;`;

        const values = [
            item.BOX_LIST, 
            item.SUPP_CODE || '-', 
            item.STOCK || 0, 
            item.MIN_STOCK || 0, 
            item.MAX_STOCK || 0,
            item.Process || '-'
        ];
        return await client.query(query, values);
    },

    logHistory: async (box_list, type, amount, client = pool) => {
        return await client.query(
            'INSERT INTO stock_history (box_list, type, amount) VALUES ($1, $2, $3)', 
            [box_list, type, amount]
        );
    },

    getHistory: async () => {
        const query = `
            SELECT h.*, p.supp_code 
            FROM stock_history h
            LEFT JOIN products p ON h.box_list = p.box_list
            ORDER BY h.created_at DESC`;
        const result = await pool.query(query);
        return result.rows;
    },

    getHistoryFiltered: async (filterType) => {
        let dateCondition = "";
        if (filterType === 'today') {
            dateCondition = "WHERE h.created_at >= CURRENT_DATE";
        } else if (filterType === '7days') {
            dateCondition = "WHERE h.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (filterType === 'month') {
            dateCondition = "WHERE h.created_at >= date_trunc('month', CURRENT_DATE)";
        }

        const query = `
            SELECT h.*, p.supp_code 
            FROM stock_history h
            LEFT JOIN products p ON h.box_list = p.box_list
            ${dateCondition}
            ORDER BY h.created_at DESC`;
        
        const result = await pool.query(query);
        return result.rows;
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