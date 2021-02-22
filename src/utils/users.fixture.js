var {Map, fromJS} = require('immutable')

const users = [
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "1",
    user_id: 'U01A144EW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': ['C019T3N7ZST'],
      'chat_duration': '5',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A140NKJE', 'U01A12343NFEW']
    })
  },
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "2",
    user_id: 'U01A1443NFEW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': 'Flexible',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A140NKJE', 'U01A12343NFEW']
    })
  },
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "3",
    user_id: 'U01A140NKJA',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '2-3',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': []
    })
  },
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "4",
    user_id: 'U01A140NKJE',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '2-3',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A140NFEW', 'U01A12343NFEW']
    })
  },  
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "5",
    user_id: 'U01A140NFEW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '2-3',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A140NKJE']
    })
  }, 
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "6",
    user_id: 'U01A12343NFEW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '4-6',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': []
    })
  },
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "7",
    user_id: 'U0B43NFEW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '4-6',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A1443NFEW']
    })
  }, 
  {
    is_setup_init: true,
    is_complete_setup: false,
    _id: "8",
    user_id: 'U0B43NFEW',
    team_id: 'T01A4NZGXTP',
    preferences: Map({
      'channel_matching': [ 'C019T3N7ZST' ],
      'chat_duration': '5',
      'prefered_group_size': '7-8',
      'saturday': [ '12:00', '12:30', '13:00' ],
      'sunday': [ '15:00', '15:30', '16:00', '22:00', '22:30' ],
      'not_prefered_convo_partner': ['U01A1443NFEW']
    })
  }
]

module.exports = users