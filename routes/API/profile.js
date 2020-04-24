const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const profile = require('../../models/Profile');
const User = require('../../models/User');

// @Route   get api/profile/me
// @desc    get current user's profile
// @access  private
router.get('/me', auth, async (req, res) => {
   try {
      const profile = await Profile.findOne({
         user: req.user.id,
      }).populate('user', ['name', 'avatar']);

      if (!profile) {
         return res
            .status(400)
            .json({ msg: 'There is no profile for this user.' });
      }
      res.json(profile);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
   }
});

module.exports = router;
