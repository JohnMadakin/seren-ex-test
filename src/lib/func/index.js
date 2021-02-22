const Match = require('../../models/match.model')
const Conversation = require('../conversation');
const Redis = require('ioredis');
const { R, availabilityCheck } = require('../questions');
const User = require('../../models/user.model');
const {
    openDialog,
    createConversation,
    createMeetingFromDirectMentions
} = require('../slackHelper')
const {matchUserFromCommand} = require('../matchHelper')
const cache = new Redis(process.env.REDIS_URL);
const {directMessage} = require('../slackNotification')
const {buildConvoFromMessage} = require('../messageBuilder')

const waitTime = 10

cache.ping(function (err, result) {
    if (err) {
        console.log("redis error", err)
    }
    cache.flushall()
    console.log("redis ready", result);
});

const checkContextCache = (user)=>{
    console.log("user here", user)
    return cache.get(user, (err, result)=>{
        if (err) {
            console.log('redis error', err)
        }
        return result;
    })
}

const saveContextToCache = (user, context)=>{
    const contextToString = JSON.stringify(context)
    return cache.set(user, contextToString ,(err, result)=>{
        if (err) {
            console.log('redis error', err)
        }
        return result;
    })
}

const getUser = async (user) => {
    return await User.findOne({ user_id: user });
}

const createUser = async (user) => {
    return await User.create({user_id: user})
}

const BotEvents = eventType => async (context) => {

    return {
        url_verification: (context) => {
            return {challenge: context.challenge}
        },
        message: async(context) => {
            const userId = context.event.user;
            // check that sender of the message is not bot user
            //TODO:  can I programmatically get the bot user id?
            if (context.event.channel_type === 'im' && !context.event.bot_id) {
                let user;
                user = await User.findOne({ user_id: userId })
                const message = context.event.text;
                createConversation(context, message, user)
            } else if (context.event.subtype === 'channel_join') {
                BotEvents(context.event.subtype)(context)
            }
        },
        create_bot: (context) => {
            try {
                const userId = context.event.user;
                const message = `Hey, thanks for adding me to your team! You can say hi to me to get started :)`;
                const conversation = new Conversation();
                conversation.addNewQuestion(message);
                const c = conversation.buildConvo();
                conversation.updateConversation(context);
                createSlackConversation(userId, c);
            } catch (error) {
                console.log("create bot error", err)
            }

        },
        member_joined_channel: (context) => {
            try {
                const userId = context.event.user;
                const message = `Hi!, \nI am Seren. I can help you create converstions with your team members easily. Lets get you ready!`;
                const conversation = new Conversation();
                conversation.addNewQuestion(message, ['Yes', 'No', 'Not Now']);
                const c = conversation.buildConvo();
                conversation.updateConversation(context);
                createSlackConversation(userId, c);
            } catch (error) {
                console.log("member joined channel error", err)
            }

        },
        app_mention: async (context) => {
            console.log(context, 'context app mention')
            const userId = context.event.user;
            const user = await User.findOne({user_id: userId});
            const message = context.event.text;
            createConversation(context, message, user)
        },
        app_home_opened: async (context) => {
            const userId = context.event.user;
            const user = await User.findOne({user_id: userId});
            console.log(user, 'user in app home opened')
            createConversation(context, '', user)
        },
        channel_join: (context) => {
            const text = "Hi!, \nI am Seren. I can help you create converstions with your team members easily. Type `/seren` to sign up in 2 mins"
            directMessage(context, text, context.event.channel)
        },
        bot_add: (context) => {
            console.log(context, 'in bot join========')
        },
        team_join: async (context) => {
            console.log(context, 'context in team join')
            const userId = context.event.user;
            const user = await User.findOne({user_id: userId});
            createConversation(context, 'hello', user)
        },
        app_uninstalled: async (context) => {
            await User.deleteMany({team_id: context.team_id})
            Match.deleteMany({team_id: context.team_id})
        },
        interactive_message: async (context) => {
            const userId = typeof(context.user) !== 'object'? context.user: context.user.id;
            // check for multiple actions later
            const user_says = context.actions[0].value;


            const bot_reply = processMessage(context, user_says, userId);
            const conversation = new Conversation();
            conversation.addNewQuestion(...Object.values(bot_reply[0]));
            const c = conversation.buildConvo();
            directMessage(context, c, userId);

        }
    }[eventType](context)
};

const SlashCommands = async (context) => {
    const user = await User.findOne({ user_id: context.user_id })
    if (context.text.includes('match')) {
        matchUserFromCommand(context, user)
    } else if (context.text.toLowerCase().includes('cm') || context.text.toLowerCase().includes('create_meeting')) {
        createMeetingFromDirectMentions(context, user, context.text)
    } else if (context.text.toLowerCase().includes('sms')) {
        openDialog(context.trigger_id, context.team_id, user)
    } else {
        createConversation(context, context.text, user)
    }
}

showScheduleInputs = (context, action, user) => {
    const ctx = {...context, team_id: context.team.id}

    const bot_reply = R(user).scheduled_times
    const conversation = new Conversation();
    conversation.addNewQuestion(...Object.values(bot_reply[0]));
    const c = conversation.buildConvo();

    const userId = user ? user.user_id : context.user.id
    directMessage(ctx, c, userId);
}

const processAvailability = async (action, context, user, teamId) => {
  const match = await Match.findOne({conversation_id: action.block_id, user_id: context.user.id})
  if (!match.expired) {
    if (action.action_id === 'yes_available') {
        await Match.updateOne({conversation_id: action.block_id, user_id: context.user.id}, {status: 'accepted'})
        if (user) {
            const message = availabilityCheck({}).acceptance_message
            const messageBlock = buildConvoFromMessage(message)
            directMessage({team_id: teamId}, messageBlock, user.user_id)
        }
    } else {
        await Match.updateOne({conversation_id: action.block_id, user_id: context.user.id}, {status: 'denied'})
    }
  }
}



module.exports = {BotEvents, SlashCommands, processAvailability};