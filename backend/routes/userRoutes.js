const express = require('express');
const { listUsersHandler, createUserHandler } = require('../controllers/userController');

const router = express.Router();

router.get('/users', listUsersHandler);
router.post('/users', createUserHandler);

module.exports = router;
