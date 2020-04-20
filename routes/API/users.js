const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');

// @Route   POST api/users
// @desc    register user
// @access  Public(no token required)
router.post(
   '/',
   // express validator
   [
      check('name', 'Name is required.').not().isEmpty(),
      check('email', 'Please include a valid email.').isEmail(),
      check(
         'password',
         'Please enter a password with 6 or more characters'
      ).isLength({ min: 6 }),
   ],
   async (req, res) => {
      console.log('POST: users.js');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      try {
         // check if user already exists in database by email
         let user = await User.findOne({ email });
         if (user) {
            //match validation error type above, use array
            return res
               .status(400)
               .json({ errors: [{ msg: 'User already exists.' }] });
         }
         const avatar = gravatar.url(email, {
            s: '200', //size
            r: 'pg', //rating
            d: 'retro', //default image if theres non
         });
         //create new user instance(not saved yet)
         user = new User({
            name,
            email,
            avatar,
            password,
         });
         //encrypt password
         const salt = await bcrypt.genSalt(10);
         user.password = await bcrypt.hash(password, salt);
         //save to database
         await user.save();
         /**********
         TO DO:
         return JWT
         **********/
         res.send('User registered.');
      } catch (err) {
         console.log(err.message);
         res.status(500).send('Server error.');
      }
   }
);

module.exports = router;
