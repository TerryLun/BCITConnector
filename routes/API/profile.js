const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require('../../models/Post')
const { response } = require("express");

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
         // Using upsert option (creates new doc if no match is found):
         let profile = await Profile.findOneAndUpdate(
           { user: req.user.id },
           { $set: profileFields },
           { new: true, upsert: true, setDefaultsOnInsert: true, useFindAndModify: false }
         );
         res.json(profile);
       } catch (err) {
         console.error(err.message);
         res.status(500).send('Server Error');
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
      // Remove user posts
      await Post.deleteMany({ user: req.user.id });
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

// @Route   PUT api/profile/experience
// @desc    Add profile experience
// @access  private
router.put(
   "/experience",
   [
      auth,
      [
         check("title", "Title is required").not().isEmpty(),
         check("company", "Company is required").not().isEmpty(),
         check("from", "From date is required").not().isEmpty(),
      ],
   ],
   async (req, res) => {
      console.log("PUT api/profile/experience/");

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const {
         title,
         company,
         location,
         from,
         to,
         current,
         description,
      } = req.body;

      const newExp = {
         title,
         company,
         location,
         from,
         to,
         current,
         description,
      };

      try {
         const profile = await Profile.findOne({ user: req.user.id });

         profile.experience.unshift(newExp);

         await profile.save();

         res.json(profile);
      } catch (error) {
         console.error(error.message);
         res.status(500).send("Server error.");
      }
   }
);

// @Route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  private
router.delete("/experience/:exp_id", auth, async (req, res) => {
   console.log("DELETE api/profile/experience/" + req.params.exp_id);

   try {
      const profile = await Profile.findOne({ user: req.user.id });

      // Get remove index
      const removeIndex = profile.experience
         .map((item) => item.id)
         .indexOf(req.params.exp_id);

      profile.experience.splice(removeIndex, 1);

      await profile.save();

      res.json(profile);
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error.");
   }
});

// @Route   PUT api/profile/education
// @desc    Add profile education
// @access  private
router.put(
   "/education",
   [
      auth,
      [
         check("school", "School is required").not().isEmpty(),
         check("degree", "Degree is required").not().isEmpty(),
         check("fieldofstudy", "Field of study is required").not().isEmpty(),
         check("from", "From date is required").not().isEmpty(),
      ],
   ],
   async (req, res) => {
      console.log("PUT api/profile/education");

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

      const {
         school,
         degree,
         fieldofstudy,
         from,
         to,
         current,
         description,
      } = req.body;

      const newEdu = {
         school,
         degree,
         fieldofstudy,
         from,
         to,
         current,
         description,
      };

      try {
         const profile = await Profile.findOne({ user: req.user.id });

         profile.education.unshift(newEdu);

         await profile.save();

         res.json(profile);
      } catch (error) {
         console.error(error.message);
         res.status(500).send("Server error.");
      }
   }
);

// @Route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  private
router.delete("/education/:edu_id", auth, async (req, res) => {
   console.log("DELETE api/profile/education/" + req.params.edu_id);

   try {
      const profile = await Profile.findOne({ user: req.user.id });

      // Get remove index
      const removeIndex = profile.education
         .map((item) => item.id)
         .indexOf(req.params.edu_id);

      profile.education.splice(removeIndex, 1);

      await profile.save();

      res.json(profile);
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error.");
   }
});

// @Route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  public
router.get("/github/:username", (req, res) => {
   try {
      console.log("GET api/profile/github/" + req.params.username);

      const options = {
         uri: `https://api.github.com/users/${
            req.params.username
         }/repos?per_page=5&sort=created:asc&client_id=${config.get(
            "githubClientId"
         )}&client_secret=${config.get("githubSecret")}`,
         method: "GET",
         headers: {
            "user-agent": "node.js",
         },
      };

      request(options, (error, response, body) => {
         if (error) console.error(error);

         if (response.statusCode != 200) {
            return res.status(404).json({ msg: "No Github profile found" });
         }

         res.json(JSON.parse(body));
      });
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error.");
   }
});

module.exports = router;
