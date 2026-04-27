const express = require('express');
const upload = require('../middleware/upload');
const { uploadContentHandler } = require('../controllers/contentController');
const { getFeedHandler } = require('../controllers/feedController');

const router = express.Router();

router.post('/upload-content', upload.single('image'), uploadContentHandler);
router.get('/feed', getFeedHandler);

module.exports = router;
