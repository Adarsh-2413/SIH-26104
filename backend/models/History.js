const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional if no auth
  },
  speakerName: {
    type: String,
    required: true,
    default: 'Unknown Caller'
  },
  spoofScore: {
    type: Number,
    required: true
  },
  prosodyScore: {
    type: Number,
    required: true
  },
  speakerScore: {
    type: Number,
    required: true
  },
  contextScore: {
    type: String, // 'SAFE', 'RISKY', 'CRITICAL'
    required: true
  },
  verdict: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('History', historySchema);
