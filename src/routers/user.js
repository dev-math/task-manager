const express = require('express');
const User = require('../models/user');

const router = new express.Router();

// create user
router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// read users
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch {
    res.status(500).send();
  }
});

// read user
router.get('/users/:id', async (req, res) => {
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
router.patch('/users/:id', async  (req, res) => {
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
router.delete('/users/:id', async (req, res) => {
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
