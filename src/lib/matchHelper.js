const { uuid } = require("uuidv4");

const Match = require('../models/match.model');
const {matchUser} = require('../services/match')
const {setUpWaitQueue} = require('./slackHelper')
const {sendSlackNotificationsToMatches, sendNoMatchesFoundNotification} = require('./slackNotification')


const matchUserFromCommand = async (context, user) => {
    const teamId = context.team_id
    const matchedUsers = await matchUser(context, user, teamId)
    if (matchedUsers.length > 1) {
        const blockId = uuid()
        setUpWaitQueue(user.user_id, blockId, teamId)
        sendSlackNotificationsToMatches(matchedUsers, user, teamId, blockId, context)
    } else {
        sendNoMatchesFoundNotification(context, user.user_id)
    }
}

module.exports = {matchUserFromCommand}