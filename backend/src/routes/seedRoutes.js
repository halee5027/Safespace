const express = require('express');
const { seedDemoHandler } = require('../controllers/seedController');

const router = express.Router();

router.post('/seed-demo', seedDemoHandler);

module.exports = router;
