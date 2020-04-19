const express = require('express');
const router = express.Router();

// @Route   get api/posts
// @desc    Test route
// @access  Public(no token required)
router.get('/', (req, res) => res.send('Posts route'));

module.exports = router;
