const { uuid } = require("uuidv4");
const { WebClient } = require('@slack/web-api');
const Team = require('../models/team.model');
const Match = require('../models/match.model');
const {googleLoginLinkButton, availabilityCheck} = require('./questions')
const {buildConvoFromMessage} = require('./messageBuilder')
const {sendSMS} = require('./smsNotification')
const sendEmail = require('../utils/mailer.utils')
const {pluralize} = require('../utils/text.utils')


const sendPreferredUsersSignUpCampaignNotification = async (teamId, users) => {
  console.log(users, 'users====in notification')
  const team = await Team.findOne({slack_team_id: teamId})
  const web = new WebClient(team.access_token);
  users.map((user) => {
    web.chat.postMessage({text: `Hi <@${user}>, I am Seren. I help you dive into short and spontaneous watercooler conversations with others in the workspace. \nIf you've not set up your profile with Seren, type \`/seren\` to set up your profile`, channel: user})
  })
}

const sendGoogleLoginLink = async (teamId, userId, link) => {
  const team = await Team.findOne({slack_team_id: teamId})
  const web = new WebClient(team.access_token);
  const prompt = googleLoginLinkButton(link)
  console.log(prompt, 'prompt')
  const message = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": prompt.q
            }
        },
        ...prompt.opts.map(item => {
            return item
        })
    ]
  web.chat.postMessage({blocks: message, channel: userId})
}

const sendSlackNotificationsToMatches = (users, user, teamId, blockId, context, fromUser=false) => {
    users.map(async matchUser => {
        if (matchUser === user.user_id) {
            Match.create({user_id: user.user_id, conversation_id: blockId, team_id: teamId, status: 'accepted'})
            sendMatchNotificationsToInitiator(context, user.user_id, users, blockId)
        } else {
            const isMatched = await isMatchedInLast10mins(matchUser)

            if (!isMatched) {
                Match.create({user_id: matchUser, conversation_id: blockId, team_id: teamId})
                if (fromUser) {
                    sendMatchNotificationsToRequestedUsers(context, matchUser, blockId, user.user_id)
                }   else {
                    sendMatchNotificationsToMatches(context, matchUser, blockId)
                }
                // sendMatchEmail(matchUser, blockId)
                sendSMS(teamId, matchUser)
            }
        }
    })
}

const isMatchedInLast10mins = async (user_id) => {
    const now = new Date()
    const matches = await Match.find({user_id: user_id, createdAt: {$gt: new Date(now.getTime() - 1000 * 60 * 10)}})
    return matches.length >= 3
}

const sendMatchEmail = (user, blockId) => {
    console.log('in sending email')
    const userObj = {
        userEmail: 'test@test.com',
        subject: 'Someone wants to speak with you on Seren',
        body: availabilityCheck(blockId).initial_message[0].q + '<br> Open your slack app to respond'
    }
    sendEmail(user, userObj)
}

const sendMatchNotificationsToRequestedUsers = (context, matchedUser, blockId, requestingUserId) => {
    const message = availabilityCheck({blockId, userId: requestingUserId}).initial_message
    const messageBlock = buildConvoFromMessage(message)
    directMessage(context, messageBlock, matchedUser)
}

const sendMatchNotificationsToMatches = (context, userId, blockId = uuid()) => {
    const message = availabilityCheck({blockId}).initial_message
    const messageBlock = buildConvoFromMessage(message)
    directMessage(context, messageBlock, userId)
}

const sendMatchNotificationsToInitiator = (context, userId, matchedUsers, blockId) => {
    const userCount = matchedUsers.length - 1
    directMessage(context, `Hello there, you have ${userCount} ${pluralize('match', userCount, 'matches')}`, userId)
}

const sendNoMatchesFoundNotification = (context, userId) => {
    directMessage(context, 'I found no matches available now', userId)
}

const directMessage = async (ctx, message, userId = '') => {
    console.log('in DM', ctx)

    const getTeamId = ctx.type === 'interactive_message'? ctx.team.id: ctx.team_id
    const team = await Team.findOne({ slack_team_id: getTeamId });

    if (typeof (message) === 'string') {
        d = { text: message }
    } else {
        d = message
    }
    const web = new WebClient(team.access_token);
    await web.chat.postMessage({...d, channel: userId, as_user: true})
}


module.exports = {
  sendPreferredUsersSignUpCampaignNotification, 
  sendGoogleLoginLink, 
  directMessage,
  sendSlackNotificationsToMatches,
  sendMatchNotificationsToInitiator, 
  sendMatchNotificationsToMatches,
  sendNoMatchesFoundNotification
}

