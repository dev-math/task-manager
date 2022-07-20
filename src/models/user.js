const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  password: {
    minLength: 6,
    required: true,
    trim: true,
    type: String,
    validate(value) {
      if (value.includes("password")) {
        throw new Error("Password is invalid");
      }
    },
  },
  age: {
    type: Number,
    default: 0,
  },
});

userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
