const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

// create user
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// login user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// logout user
router.get('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(tokenObj => tokenObj.token !== req.token);
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

// read user
router.get('/users/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch {
    res.status(500).send();
  }
})

// update user
router.patch('/users/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send();
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save()

    res.send(user);
  } catch (e) {
    return res.status(400).send(e);
  }
});

// delete user
router.delete('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (e) {
    return res.status(500).send();
  }
});

module.exports = router;
