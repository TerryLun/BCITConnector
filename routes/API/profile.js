const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const profile = require("../../models/Profile");
const User = require("../../models/User");

// @Route   get api/profile/me
// @desc    get current user's profile
// @access  private
router.get("/me", auth, async (req, res) => {
   console.log("GET: api/profile/me");
   try {
      const profile = await Profile.findOne({
         user: req.user.id, // user id comes with token
      }).populate("user", ["name", "avatar"]); //reference user collections to this query, bring in name and avatar

      if (!profile) {
         return res
            .status(400)
            .json({ msg: "There is no profile for this user." });
      }
      res.json(profile);
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
   }
});

// @Route   post api/profile
// @desc    create/update user profile
// @access  private
router.post(
   "/",
   [
      auth,
      check("status", "Status is required").not().isEmpty(),
      check("skills", "skills is required").not().isEmpty(),
   ],
   async (req, res) => {
      console.log("POST: api/profile");
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const {
         company,
         website,
         location,
         bio,
         status,
         githubusername,
         skills,
         youtube,
         facebook,
         twitter,
         instagram,
         linkedin,
      } = req.body;

      //build profile object
      const profileFields = {};
      profileFields.user = req.user.id;
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (status) profileFields.status = status;
      if (githubusername) profileFields.githubusername = githubusername;
      if (skills) {
         profileFields.skills = skills.split(",").map((skill) => skill.trim());
      }

      // Build social object
      profileFields.social = {};
      if (youtube) profileFields.youtube = youtube;
      if (twitter) profileFields.twitter = twitter;
      if (facebook) profileFields.facebook = facebook;
      if (linkedin) profileFields.linkedin = linkedin;
      if (instagram) profileFields.instagram = instagram;

      try {
         let profile = await Profile.findOne({ user: req.user.id }); // user id comes with token

         // if there is a profile
         if (profile) {
            //update
            profile = await Profile.findOneAndUpdate(
               { useFindAndModify: false },
               { user: req.user.id },
               { $set: profileFields }, //set profile field
               { new: true }
            );

            return res.json(profile);
         }
         // create
         profile = new Profile(profileFields);
         await profile.save();
         res.json(profile);
      } catch (err) {
         console.error(err.message);
         res.status(500).send("Server error.");
      }
   }
);

// @Route   GET api/profile
// @desc    get all profiles
// @access  public
router.get("/", async (req, res) => {
   console.log("GET api/profile");

   try {
      const profiles = await Profile.find().populate("user", [
         "name",
         "avatar",
      ]);
      res.json(profiles);
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
   }
});

// @Route   GET api/profile/user/:user_id
// @desc    get profile by user ID
// @access  public
router.get("/user/:user_id", async (req, res) => {
   console.log(`GET: api/profile/user/${req.params.user_id}`);

   try {
      // find user by id in query parameter
      const profile = await Profile.findOne({
         user: req.params.user_id,
      }).populate("user", ["name", "avatar"]);

      if (!profile) {
         return res.status(400).json({ msg: "Profile not found." });
      }

      res.json(profile);
   } catch (err) {
      console.error(err.message);
      // profile not found error message if user id does not exist
      if (err.message.indexOf("Cast to ObjectId failed") !== -1) {
         return res.status(400).json({ msg: "Profile not found." });
      }
      res.status(500).send("Server error.");
   }
});

// @Route   DELETE api/profile
// @desc    delete profile, user & posts
// @access  private
router.delete("/", auth, async (req, res) => {
   console.log("DELETE api/profile");

   try {
      // @todo - remove users posts

      // Remove profile
      await Profile.findOneAndRemove({ user: req.user.id });
      // Remove user
      await User.findOneAndRemove({ _id: req.user.id });

      res.json({ msg: "User deleted." });
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error.");
   }
});

module.exports = router;
