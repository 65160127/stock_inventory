const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', productController.getProducts);
router.patch('/update-stock', productController.updateProducts);
router.post('/upload', upload.single('file'), productController.importExcel);
router.delete('/:id', productController.deleteProduct);
router.put('/edit', productController.editProduct);
router.get('/usage-report', productController.getUsageReport);
router.get('/history-data', productController.getHistoryData);

module.exports = router;