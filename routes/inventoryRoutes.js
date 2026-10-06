const express = require('express');
const router = express.Router();
const foodWaterController = require('../controllers/foodWaterController');
const medicineController = require('../controllers/medicineController');
const hygieneController = require('../controllers/hygieneController');
const clothesController = require('../controllers/clothesController');
const toolsLightsController = require('../controllers/toolsLightsController');
const distributionController = require('../controllers/distributionController');
const upload = require('../config/multer');
const authModule = require('../middleware/auth');
const auth = typeof authModule === 'function' ? authModule : (authModule && authModule.auth);

// Food & Water Routes
router.get('/food-water', foodWaterController.getInventory);
router.post('/food-water', foodWaterController.addItem);
router.put('/food-water/:id', foodWaterController.updateItem);
router.delete('/food-water/:id', foodWaterController.deleteItem);
router.get('/food-water/export/:format', foodWaterController.exportInventory);
router.post('/food-water/import', upload.single('file'), foodWaterController.importInventory);

// Medicine Routes
router.get('/medicine', medicineController.getInventory);
router.post('/medicine', medicineController.addItem);
router.put('/medicine/:id', medicineController.updateItem);
router.delete('/medicine/:id', medicineController.deleteItem);
router.get('/medicine/export/:format', medicineController.exportInventory);
router.post('/medicine/import', upload.single('file'), medicineController.importInventory);

// Hygiene & Sanitation Routes
router.get('/hygiene', hygieneController.getInventory);
router.post('/hygiene', hygieneController.addItem);
router.put('/hygiene/:id', hygieneController.updateItem);
router.delete('/hygiene/:id', hygieneController.deleteItem);
router.get('/hygiene/export/:format', hygieneController.exportInventory);
router.post('/hygiene/import', upload.single('file'), hygieneController.importInventory);

// Clothes & Beddings Routes
router.get('/clothes-beddings', clothesController.getInventory);
router.post('/clothes-beddings', clothesController.addItem);
router.put('/clothes-beddings/:id', clothesController.updateItem);
router.delete('/clothes-beddings/:id', clothesController.deleteItem);
router.get('/clothes-beddings/export/:format', clothesController.exportInventory);
router.post('/clothes-beddings/import', upload.single('file'), clothesController.importInventory);

// Tools & Lights Routes
router.get('/tools-lights', toolsLightsController.getInventory);
router.post('/tools-lights', toolsLightsController.addItem);
router.put('/tools-lights/:id', toolsLightsController.updateItem);
router.delete('/tools-lights/:id', toolsLightsController.deleteItem);
router.get('/tools-lights/export/:format', toolsLightsController.exportInventory);
router.post('/tools-lights/import', upload.single('file'), toolsLightsController.importInventory);

// Distribution Route (protected to capture distributor)
router.post('/distribute', auth, distributionController.distribute);

module.exports = router;