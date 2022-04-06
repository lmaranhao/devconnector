const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

// @route GET api/profile/me
// @desc Get current user's profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'There is no profile for this user' }] });
    }
    return res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).send('server error');
  }
});

// @route POST api/profile
// @desc Create or update user profile
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
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

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(',').map((skill) => skill.trim());

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //   update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      } else {
        //   create profile
        profile = new Profile(profileFields);
        await profile.save();
        return res.json(profile);
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send('server error');
    }
  }
);

// @route GET api/profile
// @desc Get all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    return res.json(profiles);
  } catch (error) {
    console.error(error);
    return res.status(500).send('server error');
  }
});

// @route GET api/profile/user/:user_id
// @desc Get profile by user ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile)
      return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    return res.json(profile);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    }
    return res.status(500).send('server error');
  }
});

// @route DELETE api/profile
// @desc Delete profile, user and posts
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    // $todo - remove posts
    await Profile.findOneAndRemove({
      user: req.user.id,
    });

    await User.findOneAndRemove({ _id: req.user.id });

    return res.json('Profile and user deleted');
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    }
    return res.status(500).send('server error');
  }
});

// @route PUT api/profile/experience
// @desc Add experience to profile
// @access Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExperience = {
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
      profile.experience.unshift(newExperience);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error);
      return res.status(500).send('server error');
    }
  }
);

// @route DELETE api/profile/experience/:exp_id
// @desc Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    profile.experience.pull({ _id: req.params.exp_id });
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    }
    return res.status(500).send('server error');
  }
});

// @route PUT api/profile/education
// @desc Add education to profile
// @access Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'Title is required').not().isEmpty(),
      check('degree', 'Company is required').not().isEmpty(),
      check('fieldofstudy', 'From date is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, from } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error);
      return res.status(500).send('server error');
    }
  }
);

// @route DELETE api/profile/education/:edu_id
// @desc Delete education from profile
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    profile.education.pull({ _id: req.params.edu_id });
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ errors: [{ msg: 'Profile not found' }] });
    }
    return res.status(500).send('server error');
  }
});

// @route FET api/profile/github/:username
// @desc Get user repos from github
// @access Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res
          .status(404)
          .json({ errors: [{ msg: 'No github profile found' }] });
      }

      return res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('server error');
  }
});
module.exports = router;
