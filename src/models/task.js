const mongoose = require('mongoose');

const Task = mongoose.model('Task', {
  completed: {
    default: false,
    type: Boolean
  },
  description: {
    required: true,
    trim: true,
    type: String
  },
});

module.exports = Task;
