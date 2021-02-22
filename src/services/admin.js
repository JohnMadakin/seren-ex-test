const {archiveGroupChats} = require('../lib/slackHelper')
const Team = require('../models/team.model')

const runBulkArchiving = async (teamId) => {
    const team = await Team.findOne({slack_team_id: teamId})
    if (team) {
        archiveGroupChats(team, team.bot_user_id)
    }
}

module.exports = {runBulkArchiving}