const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  completed: {
    default: false,
    type: Boolean
  },
  description: {
    required: true,
    trim: true,
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
    timestamps: true
  });


const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
