const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @Route   get api/auth
// @desc    Test route
// @access  Public(no token required)
router.get('/', auth, async (req, res) => {
   console.log('GET: auth.js');
   try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error.');
   }
});

module.exports = router;
