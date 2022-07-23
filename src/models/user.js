const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecretKey = process.env.JWT_SECRET;

const Task = require('./task.js');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid.');
      }
    }
  },
  password: {
    minLength: 6,
    required: true,
    trim: true,
    type: String,
    validate(value) {
      if (value.includes("password")) {
        throw new Error("Password is invalid.");
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number');
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
    timestamps: true
  });

// user tasks
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

// get public info about the user
userSchema.methods.toJSON = function() {
  const user = this;

  const userObj = user.toObject();

  delete userObj._id;
  delete userObj.__v;
  delete userObj.password;
  delete userObj.tokens;
  delete userObj.avatar;

  return userObj;
}

// generate jwt token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, jwtSecretKey);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
}

// login
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
}

// hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
  const user = this;

  await Task.deleteMany({ owner: user._id });

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
