const express = require('express');
const router = express.Router();

// @Route   get api/profile
// @desc    Test route
// @access  Public(no token required)
router.get('/', (req, res) => res.send('Profile route'));

module.exports = router;
