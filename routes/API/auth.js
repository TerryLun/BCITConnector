const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// @Route   get api/auth
// @desc    Test route
// @access  Public(no token required)
router.get('/', auth, async (req, res) => {
   console.log('GET: auth.js');
   try {
      //return everything about user except password
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
   } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error.');
   }
});

// @Route   POST api/auth
// @desc    authenticate user and get token
// @access  Public(no token required)
router.post(
   '/',
   // express validator
   [
      check('email', 'Please include a valid email.').isEmail(),
      check('password', 'Password required.').exists(),
   ],
   async (req, res) => {
      console.log('POST: users.js');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      try {
         // check if user already exists in database by email
         let user = await User.findOne({ email });
         if (!user) {
            //match validation error type above, use array
            return res
               .status(400)
               .json({ errors: [{ msg: 'Invalid credentials.' }] });
         }

         const isMatch = await bcrypt.compare(password, user.password);

         if (!isMatch) {
            return res
               .status(400)
               .json({ errors: [{ msg: 'Invalid credentials.' }] });
         }

         /**
         JWT
         **/
         //get payload
         const payload = {
            user: {
               //id is just _id in mongo
               id: user.id,
            },
         };
         //sign token with payload and secret
         jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600 * 24 }, //expires in 24 hours
            (err, token) => {
               if (err) throw err;
               //send token back to client
               res.json({ token });
            }
         );
      } catch (err) {
         console.log(err.message);
         res.status(500).send('Server error.');
      }
   }
);

module.exports = router;
