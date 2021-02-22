const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot_controller');
const matchController = require('../controllers/match_controller');
// const questionController = require('../controllers/questions_controller');

router.get('/add', botController.getAddToSlackButton);

router.get('/auth/callback', botController.handleCallback);

router.post('/messages', botController.handleSlackMessages);

router.get('/google/auth', botController.authenticateGoogle);

router.get('/match', matchController.handleBulkMatch);

// router.get('/questions', questionController.handleGetQuestion);

module.exports = router;
