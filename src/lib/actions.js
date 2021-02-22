const User = require('../models/user.model');
const Match = require('../models/match.model');
const { setupQuestions, daysOfTheWeek } = require('./questions');
const { processAvailability } = require('./func/index');
const { generateAuth } = require('./google');
const { inviteAppToChannels } = require('./slackHelper');
const {
  sendPreferredUsersSignUpCampaignNotification,
  sendGoogleLoginLink,
} = require('./slackNotification');
const axios = require('axios').default;

const instance = axios.create({
  baseURL: 'https://slack.com/api',
  headers: {
    Authorization: `Bearer ${process.env.BOT_OAUTH}`,
    'Content-type': 'application/json',
  },
});
const { Answers } = require('../models/answers.model');

const saveAction = async (context, action, teamId) => {
  const userId = context.user.id;
  const user = await User.findOne({ user_id: userId });

  const { channel, container } = context;

  if (action.action_id === 'google_login') {
    return;
  }

  if (action.action_id === 'prefered_schedule') {
    return showScheduleInputs(context, action, user);
  }

  if (action.action_id === 'prefered_auto_schedule') {
    const url = generateAuth(userId, teamId);
    return sendGoogleLoginLink(teamId, userId, url);
  }

  switch (action.action_id) {
    case 'seren-enjoy-convo-1':
    case 'seren-enjoy-convo-2':
    case 'seren-enjoy-convo-3':
    case 'seren-enjoy-convo-4':
    case 'seren-enjoy-convo-5':
      await instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Did you enjoy your recent conversation on Seren?',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Thank you for your feedback.',
            },
          },
        ],
      });

      Answers.create({
        user_id: user.user_id,
        open_conversation: true,
        questions: [
          {
            question:
              'How happy are you with your recent conversation on Seren?',
            answer: action.value,
          },
        ],
      });

      const match = await Match.findOne({
        user_id: user.user_id,
      }).sort({ created_at: -1 });

      const usersInCall = (
        await Match.find({
          conversation_id: match.conversation_id,
        })
      )
        .map((m) => m.user_id)
        .filter((u) => u !== user.user_id);

      instance.post('/chat.postMessage', {
        channel: channel.id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Who did you most enjoy talking to the call?',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Select users: ',
            },
            accessory: {
              action_id: 'after-seren-multi-user-select',
              type: 'multi_users_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select users',
                emoji: true,
              },
            },
          },
        ],
      });
      break;

    case 'after-seren-multi-user-select':
      await instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Who did you most enjoy talking to on the call?',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Great!',
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question: 'Who did you most enjoy talking to the call?',
              answer: action.selected_users,
            },
          },
        },
        () => {}
      );

      if (!user.completed_feedback) {
        {
          instance.post('/chat.postMessage', {
            channel: channel.id,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'plain_text',
                  text:
                    'Thank you for answering! Let us get to know you for better conversations!',
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'actions',
                elements: [
                  {
                    action_id: 'seren-enjoy-chat-yes',
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Sure, go for it!',
                    },
                    value: 'YES',
                  },
                  {
                    action_id: 'seren-enjoy-chat-no',
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Not right now.',
                    },
                    value: 'NO',
                  },
                ],
              },
            ],
          });
        }
      }
      break;

    case 'seren-enjoy-chat-yes':
      await instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text:
                'Thank you for answering! Let us get to know you for better conversations!',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: ':muscle:',
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question:
                'Thank you for answering! Let us get to know you for better conversations!',
              answer: action.value,
            },
          },
        },
        () => {}
      );

      instance.post('/chat.postMessage', {
        channel: channel.id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'What are you most interested in on Seren?',
            },
            accessory: {
              action_id: 'seren-most-interested-select',
              type: 'static_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select an item',
                emoji: true,
              },
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Professional networking',
                    emoji: true,
                  },
                  value: 'Professional networking',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Informal chats',
                    emoji: true,
                  },
                  value: 'Informal chats',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Meeting people with shared interests',
                    emoji: true,
                  },
                  value: 'Meeting people with shared interests',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Not sure',
                    emoji: true,
                  },
                  value: 'Not sure',
                },
              ],
            },
          },
        ],
      });
      break;

    case 'seren-enjoy-chat-no':
      instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text:
                'Thank you for answering! Let us get to know you for better conversations!',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Got it! Another time.',
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question:
                'Thank you for answering! Let us get to know you for better conversations!',
              answer: action.value,
            },
          },
        },
        () => {}
      );
      break;

    case 'seren-most-interested-select':
      await instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'What are you most interested in on Seren?',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: "Thanks! We're nearly done",
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question: 'What are you most interested in on Seren?',
              answer: action.selected_option.value,
            },
          },
        },
        () => {}
      );

      instance.post('/chat.postMessage', {
        channel: channel.id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                'What are your favorite interests? Here are some shared interests you have! Select up to 5.',
            },
            accessory: {
              type: 'multi_static_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select items',
              },
              action_id: 'seren-interests-checkbox-action',
              max_selected_items: 5,
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Outdoors',
                  },
                  value: 'Outdoors',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Sports',
                  },
                  value: 'Sports',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Travel',
                  },
                  value: 'Travel',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Games (board & computer)',
                  },
                  value: 'Games (board & computer)',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Music',
                  },
                  value: 'Music',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Gym',
                  },
                  value: 'Gym',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Arts (writing, dance etc)',
                  },
                  value: 'Arts',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Pets',
                  },
                  value: 'Pets',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Food',
                  },
                  value: 'Food',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'Movies',
                  },
                  value: 'Movies',
                },
              ],
            },
          },
        ],
      });
      break;

    case 'seren-interests-checkbox-action':
      await instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'What are your favorite interests?',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: 'Just one more question left.',
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question: 'What are your favorite interests??',
              answer: action.selected_options.map((o) => o.value),
            },
          },
        },
        () => {}
      );

      instance.post('/chat.postMessage', {
        channel: channel.id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text:
                'Do you tend to be outgoing or reserved in social conversations?',
              emoji: true,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'actions',
            elements: [
              {
                action_id: 'seren-user-personality-1',
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Very Reserved',
                },
                value: 'Very Reserved',
              },
              {
                action_id: 'seren-user-personality-2',
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Moderately Reserved',
                },
                value: 'Moderately Reserved',
              },
              {
                action_id: 'seren-user-personality-3',
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Neutral',
                },
                value: 'Neutral',
              },
              {
                action_id: 'seren-user-personality-4',
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Somewhat Outgoing',
                },
                value: 'Somewhat Outgoing',
              },
              {
                action_id: 'seren-user-personality-5',
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Very Outgoing',
                },
                value: 'Very Outgoing',
              },
            ],
          },
        ],
      });
      break;

    case 'seren-user-personality-1':
    case 'seren-user-personality-2':
    case 'seren-user-personality-3':
    case 'seren-user-personality-4':
    case 'seren-user-personality-5':
      instance.post('/chat.update', {
        channel: container.channel_id,
        ts: container.message_ts,
        as_user: true,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text:
                'Thank you for taking time to answer our questions. :simple_smile:',
              emoji: true,
            },
          },
        ],
      });

      Answers.update(
        { user_id: user.user_id, open_conversation: true },
        {
          $push: {
            questions: {
              question:
                'Do you tend to be outgoing or reserved in social conversations?',
              answer: action.value,
            },
          },
        },
        () => {}
      );
      User.updateOne(
        {
          user_id: user.user_id,
        },
        {
          completed_feedback: true,
        },
        () => {}
      );
      break;

    default:
      break;
  }

  if (['yes_available', 'no_available'].includes(action.action_id)) {
    return processAvailability(action, context, user, teamId);
  }

  const preferences = daysOfTheWeek
    .map((day) => day.toLowerCase())
    .includes(action.action_id)
    ? scheduleOptions(action)
    : chooseActionKey(action);
  // console.log(
  //   filterOutUserFromPreferences(userId, preferences),
  //   'what is the preference object'
  // );
  const sanitizedPreferences = filterOutUserFromPreferences(
    userId,
    preferences
  );

  if (user) {
    const newPreferences = {
      ...(user.preferences && {
        ...user.preferences.toJSON(),
      }),
      ...sanitizedPreferences,
    };
    if (sanitizedPreferences.channel_matching) {
      await inviteAppToChannels(
        context,
        userId,
        sanitizedPreferences.channel_matching
      );
    }

    await User.updateOne(
      { user_id: userId },
      {
        $set: {
          preferences: newPreferences,
          ...isSetUpComplete(newPreferences),
        },
      }
    );
  } else {
    await User.create({
      user_id: userId,
      team_id: teamId,
      preferences: sanitizedPreferences,
      ...isSetUpComplete(sanitizedPreferences),
      is_setup_init: true,
    });
  }
  if (
    sanitizedPreferences.prefered_convo_partner &&
    sanitizedPreferences.prefered_convo_partner.length
  ) {
    return sendPreferredUsersSignUpCampaignNotification(
      teamId,
      sanitizedPreferences.prefered_convo_partner
    );
  }
};

const filterOutUserFromPreferences = (userId, preferences) => {
  let userPreferences = { ...preferences };
  console.log({ preferences, userPreferences });

  if (preferences && preferences.prefered_convo_partner) {
    const filterPreferedWithoutUser = preferences.prefered_convo_partner.filter(
      (preference) => preference !== userId
    );
    userPreferences = {
      ...userPreferences,
      prefered_convo_partner: filterPreferedWithoutUser,
    };
  }

  if (preferences && preferences.not_prefered_convo_partner) {
    const filterUnPreferedWithoutUser = preferences.not_prefered_convo_partner.filter(
      (preference) => preference !== userId
    );
    userPreferences = {
      ...userPreferences,
      not_prefered_convo_partner: filterUnPreferedWithoutUser,
    };
  }
  return userPreferences;
};

saveDialogResult = async (action) => {
  const user = await User.findOne({ user_id: action.user.id });

  if (action.view.callback_id === 'phone_number') {
    const newPreferences = {
      ...(user.preferences && {
        ...user.preferences.toJSON(),
      }),
      phone: action.view.state.values.phone_number.phone.value,
    };
    await User.updateOne(
      { user_id: user.user_id },
      { $set: { preferences: newPreferences } }
    );
  }
};

const isSetUpComplete = (preferences) => {
  return {
    is_complete_setup:
      Object.keys(setupQuestions()).length === Object.keys(preferences).length
        ? true
        : false,
  };
};

const chooseActionKey = (action) => {
  switch (action.action_id) {
    case 'channel_matching':
      return { channel_matching: action.selected_channels };
    case 'prefered_convo_partner':
      return { prefered_convo_partner: action.selected_users };
    case 'not_prefered_convo_partner':
      return { not_prefered_convo_partner: action.selected_users };
    case 'prefered_group_size':
      return { prefered_group_size: action.selected_option.value };
    case 'chat_duration':
      return { chat_duration: action.selected_option.value };
  }
};

const scheduleOptions = (action) => {
  return {
    [action.action_id]: action.selected_options.map((option) => option.value),
  };
};

module.exports = {
  saveAction,
  saveDialogResult,
  scheduleOptions,
  chooseActionKey,
  isSetUpComplete,
  filterOutUserFromPreferences,
};
