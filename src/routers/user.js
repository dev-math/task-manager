const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();

// create user
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    const isSetted = await User.findOne({ email: user.email });
    if (isSetted) {
      throw new Error('Email exists');
    }

    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// login user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// logout user
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(tokenObj => tokenObj.token !== req.token);
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// logout user from all devices
router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// read user login profile 
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// update user
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save()

    res.send(req.user);
  } catch (e) {
    return res.status(400).send(e);
  }
});

// delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    return res.status(500).send();
  }
});

// add user avatar
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error('Please provide a image file'));
    }
    
    cb(undefined, true);
  }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  // convert image to png and resize it
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (err, req, res, next) => {
    res.status(400).send(err.message);
});

// get user avatar
router.get('/users/me/avatar', auth, async (req, res) => {
  try {
    // const user = await User.findById('62da3f302ff75843cebc1d75');

    if (!req.user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/jpg');
    res.send(req.user.avatar);
  } catch (e) {
    return res.status(404).send();
  }
});

// delete user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      throw new Error();
    }

    req.user.avatar = undefined;
    req.user.save();
    res.send(req.user);
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
