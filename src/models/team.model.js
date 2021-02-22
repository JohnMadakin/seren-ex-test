const mongoose = require('mongoose');
const teamSchema = new mongoose.Schema({
    slack_team_id: {
        type: String,
    },
    slack_team_name: {
        type: String,
    },
    access_token: {
        type: String,
    },
    bot_user_id:{
        type: String,
    },
    app_channel: {
        type: String,
    },
    slack_authed_user_id:{
        type: String,
    } 
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;

