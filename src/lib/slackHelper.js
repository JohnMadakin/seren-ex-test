const { uuid } = require('uuidv4');

const HttpUtils = require('../utils/http.utils');
const Conversation = require('./conversation');
const { WebClient } = require('@slack/web-api');
const PromisePool = require('@supercharge/promise-pool');
const Team = require('../models/team.model');
const Match = require('../models/match.model');
const User = require('../models/user.model');
const {
  directMessage,
  sendSlackNotificationsToMatches,
  sendMatchNotificationsToMatches,
} = require('./slackNotification');
const {
  checkAcceptedUsers,
  createGroupsByGroupSize,
  groupByLikesAndUnlikes,
} = require('../services/match');
const {
  R,
  Q,
  availabilityCheck,
  meetingMessage,
  archivingMessage,
  notPermitted,
} = require('./questions');
const {
  buildConvoFromMessage,
  showWelcomeMessage,
  showSetUpMessage,
  parseMessageForUsers,
} = require('./messageBuilder');
const { createSkypeMeeting } = require('../services/skype');
const { chunkList } = require('../utils/general.utils');
const { startFeedbackConvo } = require('../controllers/questions_controller');

const WaitTime = 0.25;//process.env.ACCEPT_WAIT_TIME || 1.5;

/**
 *
 * @param {Object} team
 *
 * This returns a list of non-archived channels in a Slack team.
 */
const getChannels = async (team) => {
  const web = new WebClient(team.access_token);
  const channels = await web.conversations.list({
    exclude_archived: true,
    types: 'private_channel',
    limit: 50,
  });
  return channels;
};

const getRandomArray = (array, n = 2) => {
  return array.sort(() => Math.random() - Math.random()).slice(0, n);
};

/**
 * This pops up the modal dialog to enter a phone number, we use this phone number to send sms
 * @param {String} triggerId
 * @param {String} teamId
 * @param {Object} user
 */
const openDialog = async (triggerId, teamId, user) => {
  const team = await Team.findOne({ slack_team_id: teamId });
  const web = new WebClient(team.access_token);

  web.views
    .open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'phone_number',
        title: {
          type: 'plain_text',
          text: 'Enter your Phone Number',
        },
        submit: {
          type: 'plain_text',
          text: 'Save',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'phone_number',
            label: {
              type: 'plain_text',
              text: 'Phone Number',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'phone',
              placeholder: {
                type: 'plain_text',
                text:
                  'Enter your phone number with the country extension e.g +19180095707',
              },
              multiline: false,
              ...(user.preferences &&
                user.preferences.has('phone') && {
                  initial_value: user.preferences.get('phone'),
                }),
            },
            optional: false,
          },
        ],
      },
    })
    .then((res) => {
      //   console.log(res, 'opening ....');
    });
};

/**
 * Creates and sends a slack message to the user depending on the message they entered in Slack
 * @param {Object} context
 * @param {String} message the slack message e.g hi, update, help etc
 * @param {Object} user
 */
const createConversation = (context, message, user) => {
  try {
    const bot_reply = processDirectMessage(context, message, user);

    if (bot_reply) {
      const conversation = new Conversation();
      conversation.addNewQuestion(...Object.values(bot_reply[0]));
      const c = conversation.buildConvo();
      let userId;

      if (user) {
        userId = user.user_id;
      } else if (context.user_id) {
        userId = context.user_id;
      } else {
        userId = context.event.user;
      }

      directMessage(context, c, userId);
    }
  } catch (error) {
    console.error('direct mention', error);
  }
};

/***
 * This determines what response to send back to Slack based on the message and the user state
 */
const processDirectMessage = (context, message, user) => {
  console.log(user, 'what is user=========');
  if (message.toLowerCase().includes('help')) {
    return R().help;
  }
  if (user) {
    if (
      message.toLowerCase().includes('cm') ||
      message.toLowerCase().includes('create_meeting')
    ) {
      const users = parseMessageForUsers(context, message);

      createGroupConversationAndAddCallLink(context, message, users);
      return R().meeting_creation;
    }
    if (message.toLowerCase().includes('archive')) {
      if (user.admin) {
        archiveGroupChats(context, user).then((r) => {
          //   console.log(r, 'r');
        });
        return archivingMessage();
      } else {
        return notPermitted();
      }
    }
    if (message.toLowerCase().includes('hi')) {
      return showSetUpMessage(user);
    }
    if (message.toLowerCase().includes('update')) return R(user).update_setup;
    if (message.toLowerCase().includes('list')) return R().list;
    if (context.event.type === 'app_mention') return showSetUpMessage(user);
  } else {
    return showWelcomeMessage();
  }
};

const foundEnoughUsers = (users) => {
  return users.length > 1;
};

/**
 * This sends notifications to users who are matched in the cron workflow asking if they are available
 * and also setups a timeout that runs after a defined time (2 mins for now)
 * and checks the users who have accepted the matches
 * @param {Array} userIds an array of slack user ids of the matched users
 * @param {String} teamId
 * @param {Object} botUser the bot users acts as the triggering user since this runs from the cron job
 */
const matchUserFromCron = async (userIds, teamId, botUser) => {
  if (foundEnoughUsers(userIds)) {
    const blockId = uuid(); // need the block id to identify the notifications that went out in the same match flow
    setUpWaitQueueAndGroup(blockId, teamId, botUser);

    userIds.map((userId) => {
      Match.create({
        user_id: userId,
        conversation_id: blockId,
        team_id: teamId,
      });
      sendMatchNotificationsToMatches({ team_id: teamId }, userId, blockId);
    });
  }
};

/**
 * sets up a time that runs after a defined time (2 mins for now) and checks
 * all the accepted users, groups them and sends a call link. This is called in the cron job flow
 * TO DO: DRY up this and the setUpWaitQueue method since they are really similar
 * @param {String} blockId
 * @param {String} teamId
 * @param {Object} botUser
 */
const setUpWaitQueueAndGroup = (blockId, teamId, botUser) => {
  setTimeout(async () => {
    const users = await checkAcceptedUsers(blockId);
    console.log(users, 'accepted_users');
    if (users && users.length > 1) {
      const usersSortedByLikes = groupByLikesAndUnlikes(users);
      const userGroups = createGroupsByGroupSize(usersSortedByLikes);
      userGroups.map((userGroup) => {
        const userIds = userGroup.map((user) => user.user_id);
        if (userIds && userIds.length > 1) {
          createGroupConversationAndAddCallLink(
            { team_id: teamId },
            botUser,
            userIds,
            true
          ); // trigger group creation
        } else if (userIds.length === 1) {
          directMessage(
            { team_id: teamId },
            'Sorry, we could not find another person to get on a call with you',
            userIds[0]
          );
        }
      });
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    } else {
      // directMessage({team_id: teamId}, 'no one was available now, please try again later', userId)
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    }
  }, WaitTime * 60000);
};

/**
 * Sets up the timeout queue that runs when a user uses the create meeting command where they specify the people they want a call with
 * @param {String} userId
 * @param {String} blockId
 * @param {String} teamId
 * @param {Array} requestedUsers
 */
const setUpQueueForCM = (userId, blockId, teamId, requestedUsers) => {
  setTimeout(async () => {
    const users = await checkAcceptedUsers(blockId);
    const userIds = users.map((user) => user.user_id);
    if (users && users.length) {
      createGroupConversationAndAddCallLink(
        { team_id: teamId },
        userId,
        userIds,
        true
      ); // trigger group creation
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    } else {
      const message =
        requestedUsers.length > 1
          ? 'All users requested are not available, please try again later'
          : `<@${requestedUsers[0]}> is not available now, please try again later`;
      directMessage({ team_id: teamId }, message, userId);
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    }
  }, WaitTime * 60000);
};

/**
 * sets up a time that runs after a defined time (2 mins for now) and checks
 * all the accepted users, groups them and sends a call link. This is called when a user triggers the match flow
 * TO DO: consolidate this and the setUpWaitQueueAndGroup method since they are really similar
 * @param {String} userId
 * @param {String} blockId
 * @param {String} teamId
 */
const setUpWaitQueue = (userId, blockId, teamId) => {
  setTimeout(async () => {
    const users = await checkAcceptedUsers(blockId);
    if (users && users.length > 1) {
      const usersSortedByLikes = groupByLikesAndUnlikes(users);
      const userGroups = createGroupsByGroupSize(usersSortedByLikes);
      userGroups.map((userGroup) => {
        const userIds = userGroup.map((user) => user.user_id);
        if (userIds.length > 1) {
          createGroupConversationAndAddCallLink(
            { team_id: teamId },
            userId,
            userIds,
            true
          ); // trigger group creation
        } else if (userIds[0] === userId) {
          directMessage(
            { team_id: teamId },
            'no one was available now, please try again later',
            userId
          );
        }
      });
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    } else {
      directMessage(
        { team_id: teamId },
        'no one was available now, please try again later',
        userId
      );
      Match.updateMany({ conversation_id: blockId }, { expired: true });
    }
  }, WaitTime * 60000);
};

/**
 * This puts users into slack private channels in groups and gives each groups a call link
 * @param {*} context
 * @param {*} userId
 * @param {*} userIds
 * @param {*} sendToPublicChannel
 */
const createGroupConversationAndAddCallLink = async (
  context,
  userId,
  userIds,
  sendToPublicChannel = false
) => {
  Promise.resolve(createConversationGroup(context, userId, userIds))
    .then(async (res) => {
      const meetingData = {
        username: userId,
        date: null,
      };
      const meeting = await createSkypeMeeting();
      const meetingUrl = meeting.joinLink;
      const user = await User.findOne({ user_id: userId });
      const meetingLink = `Hey Team! This is your call link for the chat ${meetingUrl}. If you've not set up your seren profile, type \`/seren\` to do so after the call.`;
      const channelId = res.channel.id;
      directMessage(context, meetingLink, channelId);
      const publicMeetingText = buildConvoFromMessage(
        meetingMessage(meetingUrl).public_meeting
      );
      if (sendToPublicChannel) {
        const team = await Team.findOne({ slack_team_id: context.team_id });
        const web = new WebClient(team.access_token);
        const channel = team.app_channel;
        if (channel) {
          directMessage(context, publicMeetingText, channel);
        }
      }
    })
    .catch(console.error);
};

/**
 * Constructs the private channel names using the Date and 3 random numbers
 */
const channelName = () => {
  const date = new Date();
  const year = Intl.DateTimeFormat('en-US', { year: '2-digit' }).format(date);
  const day = Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date);
  const random3Number = ('' + Math.random()).substring(2, 5);
  return ['seren', year + day, random3Number].join('-');
};

const createConversationGroup = async (ctx, userId, users = []) => {
  const team = await Team.findOne({ slack_team_id: ctx.team_id });
  const request = {
    channel: userId,
    name: channelName(),
    token: team.access_token,
    is_private: true,
  };

  const url = 'https://slack.com/api/conversations.create';
  const r = await HttpUtils.post({
    url,
    data: request,
    headers: {
      Authorization: `Bearer ${team.access_token}`,
      'Content-type': 'application/json',
    },
  })
    .then(async (res) => {
      const channel = res.data.channel.id;
      const usersWithBot = users; //for now, later it will be everyone specified and the bot
      await inviteConversationGroupUsers(ctx, channel, usersWithBot);
      startFeedbackConversation(users);
      return res.data;
    })
    .catch((e) => console.error(e));
  return r;
};

const startFeedbackConversation = (users) => {
  setTimeout(() => {
    startFeedbackConvo(users);
  }, WaitTime * 60000);
};

const inviteConversationGroupUsers = async (ctx, channel, users) => {
  const team = await Team.findOne({ slack_team_id: ctx.team_id });

  const request = {
    channel,
    token: team.access_token,
    users: users.join(','),
  };

  const url = 'https://slack.com/api/conversations.invite';
  const r = await HttpUtils.post({
    url,
    data: request,
    headers: {
      Authorization: `Bearer ${team.access_token}`,
      'Content-type': 'application/json',
    },
  })
    .then((res) => res.data)
    .catch((e) => console.log(e));
};

const joinChannels = (channels) => {
  return channels.map((channel) => `<#${channel}>`).join(',');
};

const inviteAppToChannels = async (ctx, userId, channels) => {
  const context = { team_id: ctx.team.id };
  await PromisePool.withConcurrency(2)
    .for(channels)
    .process(async (data) => {
      await joinConversation(context, data);
    });
  const message = `Seren has been added to the following channels: ${joinChannels(
    channels
  )}`;
  directMessage(context, message, ctx.channel.id);
};

const joinConversation = async (ctx, channel) => {
  const team = await Team.findOne({ slack_team_id: ctx.team_id });

  const request = {
    channel,
    token: team.access_token,
  };

  const url = 'https://slack.com/api/conversations.join';
  const r = await HttpUtils.post({
    url,
    data: request,
    headers: {
      Authorization: `Bearer ${team.access_token}`,
      'Content-type': 'application/json',
    },
  })
    .then((res) => res.data)
    .catch((e) => console.error(e));
};

const createMeetingFromDirectMentions = async (context, user, message) => {
  const teamId = context.team_id;
  const users = parseMessageForUsers(context, message);

  const blockId = uuid();
  setUpQueueForCM(user.user_id, blockId, teamId, users);
  sendSlackNotificationsToMatches(users, user, teamId, blockId, context, true);
};

const archiveGroupChats = async (context, user) => {
  //   console.log('got in there');
  const team = await Team.findOne({ slack_team_id: context.team_id });
  const channels = await getChannels(team);
  const web = new WebClient(team.access_token);

  await PromisePool.withConcurrency(2)
    .for(channels.channels)
    .process(async (data) => {
      if (/seren-[0-9]{4}-[0-9]{3}/.test(data.name)) {
        await web.conversations.archive({ channel: data.id });
      }
    });
};

module.exports = {
  channelName,
  joinChannels,
  archiveGroupChats,
  createConversation,
  getChannels,
  inviteAppToChannels,
  openDialog,
  setUpWaitQueue,
  setUpQueueForCM,
  matchUserFromCron,
  processDirectMessage,
  createMeetingFromDirectMentions,
};
