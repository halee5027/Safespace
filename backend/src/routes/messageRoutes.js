const express = require('express');
const { sendMessageHandler, getConversationHandler } = require('../controllers/messageController');

const router = express.Router();

router.post('/send-message', sendMessageHandler);
router.get('/messages', getConversationHandler);

module.exports = router;
