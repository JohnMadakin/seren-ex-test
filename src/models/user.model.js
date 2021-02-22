const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
  },
  team_id: {
    type: String,
  },
  preferences: {
    type: Map,
  },
  is_setup_init: {
    type: Boolean,
    default: false,
  },
  is_complete_setup: {
    type: Boolean,
    default: false,
  },
  google_refresh_token: {
    type: String,
  },
  google_access_token: {
    type: String,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  completed_feedback: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
