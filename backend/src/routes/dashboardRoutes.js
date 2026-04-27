const express = require('express');
const { getDashboardMetricsHandler } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/dashboard/metrics', getDashboardMetricsHandler);

module.exports = router;
