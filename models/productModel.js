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
    upsert: async (item) => {
        const query = `
            INSERT INTO products (box_list, supp_code, stock, min_stock, max_stock, "process")
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (box_list) DO UPDATE 
            SET supp_code = EXCLUDED.supp_code, 
                stock = EXCLUDED.stock, 
                min_stock = EXCLUDED.min_stock,
                max_stock = EXCLUDED.max_stock,
                "process" = EXCLUDED."process";
        `;
        const values = [
            item.BOX_LIST, 
            item.SUPP_CODE, 
            item.STOCK || 0, 
            item.MIN_STOCK || 0, 
            item.MAX_STOCK || 0,
            item.Process || '-' 
        ];
        return await pool.query(query, values);
    }
};
module.exports = Product;