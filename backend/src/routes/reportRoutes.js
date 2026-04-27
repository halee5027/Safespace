const express = require('express');
const { createReportHandler } = require('../controllers/reportController');

const router = express.Router();

router.post('/reports', createReportHandler);

module.exports = router;
