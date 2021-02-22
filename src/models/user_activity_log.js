const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
    type: {
        type: String,
    },
    message_id: {
        type: String,
    },
    content: {
        type: String,
    },
    from_user: {
        type: String,
    },
    channel: {
        type: String,
    },
    team:{
        type: String,
    },
    action_resolved:{
        type: String,
    },
    time:{
        type: String
    },
    scope:{
        type: String
    }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;