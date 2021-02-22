const mongoose = require('mongoose');
const meetingSchema = new mongoose.Schema({
    user: {
        type: String,
    },
    meeting_url: {
        type: String,
    },
    meeting_id: {
        type: String
    }
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;