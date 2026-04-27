const express = require('express');
const {
  getFlaggedContentHandler,
  reviewMessageHandler,
  reviewPostHandler,
  banUserHandler
} = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/flags', getFlaggedContentHandler);
router.post('/admin/review/message/:messageId', reviewMessageHandler);
router.post('/admin/review/post/:postId', reviewPostHandler);
router.post('/admin/ban/:userId', banUserHandler);

module.exports = router;
