const express = require('express');
const { getAlertsHandler, markAlertReadHandler } = require('../controllers/alertsController');

const router = express.Router();

router.get('/alerts/:userId', getAlertsHandler);
router.patch('/alerts/read/:alertId', markAlertReadHandler);

module.exports = router;
