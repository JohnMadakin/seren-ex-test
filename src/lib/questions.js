const Q = {
    channel_matching: [{q: 'What channels do you want us to match you in?',}],
    chat_duration: [{q: 'How long do you want to chat with colleagues?', opts: ['2-5 mins', '5-10 mins', '10 mins +', 'Flexible']}],
    prefered_group_size: [{q: 'What’s the best group size for you to have watercooler convos with?', opts: ['1 person', '2-3 persons', '4-7 persons', '8+']}],
    prefered_convo_partner: [{q: 'Who do you already enjoy talking to?',}], //if opts is blank, return text box so they can type names
    not_prefered_convo_partner: [{q: 'Who don’t you talk to as much?',}],
    connect_calender: [{q: 'Connect your calendar to give us access to your schedule so we know when to arrange chats for you! OR give us a couple of slots when you’re usually free every week', opts: ['calender', 'select days']}],
    select_prefered_time: [{q: 'Select Prefered Time', opts: ['0800 - 0830', '0900 - 1045', '1500 - 1545']}], //e.g 2:00pm to 3:00pm or 4:45pm to 6:00pm
    bot_generated_meet: [{q: 'Hey Ada! Some of your team-mates may be available for a call now, do you want to jump into a call with them?', opts:['Join Now', 'Anothern Time']}],
    user_selected_another_time: [{q: 'Select Avalaible Time', opts: ['In 10 mins', '1hr', '2hrs', 'specify minutes']}]
};

const meetingDurations = [
    '2', '5', '10', '15', '30', 'Flexible'
]

const groupSize = [
    '2-3',
    '4-7',
    '8-10'
]

const daysOfTheWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const meetingTimes = [
    '01:00 AM',
    '01:30 AM',
    '02:00 AM',
    '02:30 AM',
    '03:00 AM',
    '03:30 AM',
    '04:00 AM',
    '04:30 AM',
    '05:00 AM',
    '05:30 AM',
    '06:00 AM',
    '06:30 AM',
    '07:00 AM',
    '07:30 AM',
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 AM',
    '12:30 AM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
    '05:00 PM',
    '05:30 PM',
    '06:00 PM',
    '06:30 PM',
    '07:00 PM',
    '07:30 PM',
    '08:00 PM',
    '08:30 PM',
    '09:00 PM',
    '09:30 PM',
    '10:00 PM',
    '10:30 PM',
    '11:00 PM',
    '11:30 PM',
    '12:00 PM',
    '12:30 PM',
]

const initialMultiOptions = (key, user) => {
    return (user && user.preferences && user.preferences.has(key)) ?
    user.preferences.get(key) : []
}

const initialStaticMultiOptions = (key, user) => {
    return user.preferences.get(key).map(item => ({
        "text": {
            "type": "plain_text",
            "text": `${item}`,
            "emoji": true,
        },
        "value": `${item}`
    }))
}

const setupQuestions = (user=null) => {

    const durationOptions = (user && user.preferences && user.preferences.has('chat_duration')) ? {
        "text": {
            "type": "plain_text",
            "text": `${user.preferences.get('chat_duration')} mins`,
            "emoji": true,
        },
        "value": `${user.preferences.get('chat_duration')}`
    } : null
    const preferedGroupSize = (user && user.preferences && user.preferences.has('prefered_group_size')) ? {
        "text": {
            "type": "plain_text",
            "text": user.preferences.get('prefered_group_size'),
            "emoji": true,
        },
        "value": user.preferences.get('prefered_group_size')
    } : null

    return {
        channel_matching: {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":slack: What channel do you want us to match you in?(_will add the app automatically to the public channels_)"
                },
                "accessory": {
                    "action_id": "channel_matching",
                    "type": "multi_channels_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a channel",
                        "emoji": true
                    },
                    "max_selected_items": 5,
                    "initial_channels": initialMultiOptions('channel_matching', user)
                }
        },
        chat_duration: {
            "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":alarm_clock: How long do you want to chat with colleagues?(_optional_)"
                },
                "accessory": {
                    "action_id": "chat_duration",
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a time",
                        "emoji": true
                    },
                    "options":
                        meetingDurations.map((duration) => {
                            return {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${duration} mins`,
                                    "emoji": true,
                                },
                                "value": `${duration}`
                            }
                        }),
                    ...(user && user.preferences && user.preferences.get('chat_duration') && {"initial_option": durationOptions})
                }
        },
        prefered_group_size: {
            "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "What’s the best group size for you to have watercooler convos with?(_optional_)"
                },
                "accessory": {
                    "action_id": "prefered_group_size",
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a group size",
                        "emoji": true
                    },
                    "options":
                        groupSize.map((size) => {
                            return {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${size}`,
                                    "emoji": true,
                                },
                                "value": `${size}`
                            }
                        }),
                        ...(user && user.preferences && user.preferences.get('prefered_group_size') && {"initial_option": preferedGroupSize})
                    ,
                }
        },
        prefered_convo_partner: {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":blush: Who do you already enjoy talking to?(_optional_)"
            },
            "accessory": {
                "action_id": "prefered_convo_partner",
                "type": "multi_users_select",
                "placeholder": {
                    "type": "plain_text",
                    "text": "Select all of their names",
                    "emoji": true
                },
                "initial_users": initialMultiOptions('prefered_convo_partner', user)
            }
        },
        not_prefered_convo_partner: {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":pensive: Now, who you don’t talk to as much?(_optional_)"
            },
            "accessory": {
                "action_id": "not_prefered_convo_partner",
                "type": "multi_users_select",
                "placeholder": {
                    "type": "plain_text",
                    "text": "Select all of their names",
                    "emoji": true
                },
                "initial_users": initialMultiOptions('not_prefered_convo_partner', user)
            }
        },
        schedule: {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":calendar: If I were a fish, calendars would be my ocean. I swim in them all day."
			}
        },
        prefered_schedule: {
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"action_id": "prefered_schedule",
					"text": {
						"type": "plain_text",
						"text": "Manually enter my schedule",
						"emoji": true
					},
					"value": "manual_schedule"
				},
                {
					"type": "button",
					"action_id": "prefered_auto_schedule",
					"text": {
						"type": "plain_text",
						"text": "Connect with Google Calendar",
						"emoji": true
					},
					"value": "auto_schedule"
				}
			]
		}
    }
}

const scheduleQuestions = (user=null) => {
    return daysOfTheWeek.map(day => {
        return {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": day
			},
			"accessory": {
				"type": "multi_static_select",
				"action_id": `${day.toLowerCase()}`,
				"placeholder": {
					"type": "plain_text",
					"text": "Select Time Slots",
					"emoji": true
				},
                "options": meetingTimes.map(time => {
                    return {
                        "text": {
                            "type": "plain_text",
                            "text": `${time}`,
                            "emoji": true,
                        },
                        "value": `${time}`
                    }
                }),
                ...(user &&
                user.preferences &&
                user.preferences.get(day.toLowerCase()) &&
                {"initial_options": initialStaticMultiOptions(day.toLowerCase(), user)})

			}
		}
    })
}

const availabilityCheck = ({blockId=null, channel='#general', userId=null}) => {
    const message = userId ? `<@${userId}> is` : `Some of your team-mates in ${channel} may be`
    return {
        initial_message: [{
            q: `Hi, ${message} available for a call now, do you want to jump into a call with them?.`,
            opts: [{
                "type": "actions",
                ...blockId && {"block_id": blockId},
                "elements": [
                    {
                        "type": "button",
                        "action_id": "yes_available",
                        "text": {
                            "type": "plain_text",
                            "text": "Yes, I'm available",
                            "emoji": true
                        },
                        "value": "yes_available"
                    },
                    {
                        "type": "button",
                        "action_id": "no_available",
                        "text": {
                            "type": "plain_text",
                            "text": "No, I'm not available",
                            "emoji": true
                        },
                        "value": "no_available"
                    }
                ]}]
        }],
        acceptance_message: [{q: "We'll find others to join you and let you know!"}],
        denied_message: [{}]
    }
}

const R = (user=null)  => {
    return {
        meeting_creation: [{q: 'creating a group dm with a meeting link'}],
        welcome: [{q: 'Welcome to Seren. Please authorize the app if you have not done that before '}],
        list: [{q: '* `/seren help` - helps you understand how to use seren \n * `/seren update` - to update your seren preferences \n * `/seren hi` - to start a conversation with seren \n * `/seren match` - to find people to have watercooler conversations with. \n* `/seren sms` - prompts you to enter your phone number and subscribes to SMS notifications'}],
        help: [{
            q: `1.\`/seren help\` (gets all commands available). \n 2.\`/seren hi\` (helps you setup seren up privately) \n 3. \`/seren update\` (helps update your preferences) \n4. \`/seren create_meeting <username> <username>\` or \`cm <username> <username>\` (creates a group with a meeting link with the list of specified users) \n5.\`/seren sms\` (prompts you to enter your phone number and subscribes to SMS notifications) `
        }],
        hi: [{q: 'How can I help you?', opts: ['create meeting', 'update preference']}],
        new_setup: [{
            q:
            `:clap: Thanks for joining Seren! \n Seren lets you dive into short and spontaneous watercooler conversations with others in the workspace.
            \n Before I get you connected with others, let me know more about you`,
            opts: [...Object.values(setupQuestions())]
        }],
        update_setup: [{
            q:
            `:writing_hand: *Update your preferences to streamline your matches*`,
            opts: [...Object.values(setupQuestions(user))]
        }],
        all_instructions: [{}],
        scheduled_times:[{
            q: 'Enter your prefered schedule',
            opts: [...Object.values(scheduleQuestions(user))]
        }],
        existing_setup: [{
            q: "Hello, How can I help you?",
            opts: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":one: Type `/seren cm <@username>` to create a meeting with 1 or more person e.g `/seren cm <@yuri>` creates a meeting between you and `@yuri`"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":two: Type `/seren update` to update your preferences"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":two: Type `/seren help` to ask for help"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ":two: Type `/seren sms` to enter your phone number and subscribe to SMS notifications"
                    }
                },
                {
                "type": "divider"
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "👀 View all tasks with `/seren list`\n❓Get help at any time with `/seren help` or type *help* in a DM with me"
                        }
                    ]
                }
            ]
        }]
    }
};

// const flow = [Q] //build flow structure, thought in progress
const buildFlow = (reply)=>{
    const flow_1 = [Q.chat_duration, Q.select_prefered_time]
    return flow_1
}

const archivingMessage = () => {
    return [{q: 'Got it. Archiving seren group channels now...'}]
}

const notPermitted = () => {
    return [{q: 'You do not have permission to perform this action, contact the admin for this app.'}]
}

const meetingMessage = (link) => {
    return {
        public_meeting: [{q: `Someone is using Seren for a spontaneous conversations right now! You can join in here(${link}).\n After the call, type _/seren_ to get set up with seren too`}],
    }
}

const setUpCampaignMessage = () => {
    return {
        preferred_users: [{q: 'We'}]
    }
}

const googleLoginLinkButton = (link) => {
    return {
            q: `Just a few more minutes, Click this button to complete integrating your google calendar`,
            opts: [{
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "action_id": "google_login",
                        "text": {
                            "type": "plain_text",
                            "text": "Complete your Calendar Integration",
                            "emoji": true
                        },
                        "value": "google_login",
                        "url": link
                    }
                ]}]
        }
}


module.exports = {Q, R, setupQuestions, daysOfTheWeek, availabilityCheck, meetingMessage, googleLoginLinkButton, archivingMessage, notPermitted};
