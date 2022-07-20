const mongoose = require('mongoose');

const User = mongoose.model('User', {
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

module.exports = User;
