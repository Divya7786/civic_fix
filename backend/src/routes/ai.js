const express = require('express');
const router = express.Router();
const {
    chatWithAI,
    analyzeDescription,
    enhanceDescription,
    checkDuplicate
} = require('../controllers/aiController');

router.post('/chat', chatWithAI);
router.post('/analyze-description', analyzeDescription);
router.post('/enhance-description', enhanceDescription);
router.post('/check-duplicate', checkDuplicate);

module.exports = router;
