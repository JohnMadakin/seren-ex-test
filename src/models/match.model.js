const mongoose = require('mongoose');
const matchSchema = new mongoose.Schema({
    user_id: {
        type: String,
    },
    conversation_id: {
      type: String,
    },
    team_id: {
        type: String,
    },
    status: {
        type: String,
        enum : ['accepted','denied', 'neutral'],
        default: 'neutral'
    },
    expired: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;