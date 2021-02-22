const moment = require('moment');
const ActivityLog = require("../models/user_activity_log");

const {BotEvents, SlashCommands} = require('../lib/func');
const {saveAction, saveDialogResult} = require('../lib/actions')
const Team = require('../models/team.model')
const MatchService = (require('./match'))
const {matchUserFromCron} = require('../lib/slackHelper')

const handleUserRequests = async (context) => {
    // handleActivityLog('app', context._activity.channelData)
    console.log(context, 'context========')
    if (context.ssl_check)
        return
    if (context.command) {
        return await SlashCommands(context)
    }

    if (context.payload && typeof(context.payload)) {
        context = JSON.parse(req.body.payload)
    }

    if (context.type === 'block_actions') {
        return saveAction(context, context.actions[0], context.team.id)
    } else if (context.type === 'view_submission') {
        return saveDialogResult(context)
    } else {
        let event_type
        if (['interactive_message', 'url_verification'].includes(context.type)) {
            event_type = context.type
        } else {
            event_type = context.event.type
        }
        return ['url_verification'].includes(event_type) ? BotEvents(event_type)(context) : await BotEvents(event_type)(context);
    }

    // return await context.sendActivity(r);

}

const runBulkMatching = async (teamId) => {
    const team = await Team.findOne({slack_team_id: teamId})
    if (team) {
        const userIds = await MatchService.matchFromCron(team)
        console.log(userIds, 'calling matchFromCron=======')
        if (userIds.length) {
            console.log('actually matching now')
            matchUserFromCron(userIds, teamId, team.bot_user_id)
        }
    }
}

// loop through convo array and save the object against key values
saveConversationInDb = () => { }

const handleActivityLog = async (scope, channelData) => {
    await ActivityLog.create({
        type: channelData.type,
        message_id: channelData.client_msg_id,
        content: channelData.type === 'app_mention' ? context._activity.text : '',
        from_user: channelData.user,
        channel: channelData.channel,
        team: channelData.team,
        action_resolved: false,
        time: moment(),
        scope
    })
}

module.exports = { handleUserRequests, runBulkMatching }