const express = require('express');
const upload = require('../middleware/upload');
const {
  analyzeTextHandler,
  analyzeImageHandler,
  analyzeBehaviorHandler
} = require('../controllers/moderationController');

const router = express.Router();

router.post('/analyze-text', analyzeTextHandler);
router.post('/analyze-image', upload.single('image'), analyzeImageHandler);
router.post('/analyze-behavior', analyzeBehaviorHandler);

module.exports = router;
