const { WebClient } = require('@slack/web-api')
const PromisePool = require('@supercharge/promise-pool')
const Team = require('../models/team.model')
const User = require('../models/user.model')
const Match = require('../models/match.model')
const {isAvailableOnCalender} = require('../lib/google')
const fixtureUsers = require('../utils/users.fixture.js')


/***
 * This method finds users to match, it is called when a user triggers the match command from Slack.
 * It first tries to match across users who have signed up to use Seren i.e have set up their seren profile
 * if it does not find enough users amongst the signed up users, it tries to match across the channels defined by the user
 * who triggered the match, otherwise it does not try to find users
 */
const matchUser = async (context, user, teamId, matchSettings=null) => {
  const team = await Team.findOne({slack_team_id: teamId});
  const signedUpUsersToMatch = await signedUpUsers(teamId)
  console.log(signedUpUsersToMatch, 'all signed up users===============')
  if (signedUpUsersToMatch.length > 1) {
    const {results, errors} = await PromisePool
    .withConcurrency(1) // NOTE: Keep this at 1 as google's oauthclient does not play well with async batched requests
    .for(signedUpUsersToMatch)
    .process(async data => {
      const isUserAvailable =  await checkAvailability(data, team)
      console.log(isUserAvailable, 'is available')
      if (data.user_id === user.user_id || isUserAvailable) {
        if (data.user_id !== user.user_id && !isUnlikedByInitiatingUser(user, data) && !inUnlikedByOtherUser(user, data)) {
          return data.user_id
        } else if (data.user_id === user.user_id) {
          return data.user_id
        }
      }
    })
    console.log(errors, 'errors')
    console.log(results, 'how many users')
    return results.filter(result => result)
  } else {
    const usersToMatch = await findAllUsersInChannel(user, team)
    console.log(usersToMatch, 'usersToMatch')
    return usersToMatch
  }
}


/***
 * This is finding users to match from the Cron job, not that this is only called by the cron job
 * It runs across all users in a slack team
 */
const matchFromCron = async (team) => {
  const teamUsersToMatch = await findAllUsersInTeam(team)
  return teamUsersToMatch
}

const signedUpUsers = async (teamId) => {
  return await User.find({team_id: teamId})
}

const findAllUsersInTeam = async (team) => {
  const allSignedUpUsers = await signedUpUsers(team.slack_team_id)
  const botUser = team.slack_authed_user_id

  if (allSignedUpUsers.length > 1) {
    const {results, errors} = await PromisePool
    .withConcurrency(3)
    .for(allSignedUpUsers)
    .process(async data => {
      const isUserAvailable =  await checkAvailability(data, team)
      if (data.user_id === botUser || isUserAvailable)
        return data.user_id
    })
    return results.filter(result => result)
  } else {
    return []
  }
}

const findAllUsersInChannel = async (user, team) => {
  const channels = user && user.preferences ? user.preferences.get('channel_matching') : null

  const web = new WebClient(team.access_token);
  const users = new Set()

  if (channels) {
    const {results, errors} = await PromisePool
    .withConcurrency(2)
    .for(channels)
    .process(async data => {
        const channel_users = await web.conversations.members({channel: data})
        channel_users.members.forEach(user => users.add(user))
    })
    return [...users]
  }
  return []
}


/***
 * This methods checks if a user is available on thier google calendar(if they've connected it),
 * otherwise it checks their availability using their manual preferences
 */
const checkAvailability = async (user, team) => {
  const userTimeZone = await getUserTimeZone(user, team)
  if (user.google_refresh_token) {
    const available = await isAvailableOnCalender(user)
    if (!available)
      return checkManualAvailability(user, team, userTimeZone)
    else
      return available
  } else {
    return checkManualAvailability(user, team, userTimeZone)
  }
}

const checkManualAvailability = (user, team, userTimeZone) => {
  // const userTimeZone = await getUserTimeZone(user, team) // Need to get the user's timezone otherwise it tries to find availability using server time
  const date = new Date()
  const day = Intl.DateTimeFormat('en-US', {...(userTimeZone.tz && {timeZone: userTimeZone.tz}), weekday: 'long'}).format(date).toLowerCase()
  const hourPostFix = Intl.DateTimeFormat('en-US', {...(userTimeZone.tz && {timeZone: userTimeZone.tz}), hour: '2-digit', hour12: true}).format(date).split(' ')
  console.log(hourPostFix, 'hourPostFix')
  const hour = hourPostFix[0]
  const postFix = hourPostFix[1] // AM or PM
  const minute = Intl.DateTimeFormat('en-US', {...(userTimeZone.tz && {timeZone: userTimeZone.tz}), minute: '2-digit'}).format(date)

  const normalizedHour = hour.length === 1 ? `0${hour}` : hour // Intl strips the leading zero in front of single digits number when it's not in 24 hour format
  if (user.preferences && user.preferences.get(day)) {
    return isAvailable(user, normalizedHour, minute, day, postFix)
  } else if (user.preferences && !user.preferences.get(day)) {
    return false
  }
  return true
}

const isAvailable = (user, hour, minute, day, postFix) => {
  if (parseInt(minute) < 30) {
    return user.preferences.has(day) && user.preferences.get(day).includes(`${hour}:00 ${postFix}`)
  }
  return user.preferences.has(day) && user.preferences.get(day).includes(`${hour}:30 ${postFix}`)
}

const getUserTimeZone = async (user, team) => {
  const web = new WebClient(team.access_token);
  const userInfo = await web.users.info({user: user.user_id, include_locale: true})
  return {tz: userInfo.user.tz, tz_offset: userInfo.user.tz_offset}
}

const checkAcceptedUsers = async (conversationId) => {
  const acceptedUsers = await Match.find({conversation_id: conversationId, status: 'accepted'})
  const acceptedUsersIds = acceptedUsers.map(acceptedUser => acceptedUser.user_id)
  const users = await User.find({'user_id': { $in: acceptedUsersIds}}).sort({'preferences.prefered_group_size': 1, 'preferences.chat_duration': 1})
  return users
}

const isUnlikedByInitiatingUser = (initiatingUser, otherUser) => {
  return (initiatingUser.preferences && initiatingUser.preferences.has('not_prefered_convo_partner')) ?
  initiatingUser.preferences.get('not_prefered_convo_partner').includes(otherUser.user_id) : false
}

const inUnlikedByOtherUser = (initiatingUser, otherUser) => {
  return (otherUser.preferences && otherUser.preferences.has('not_prefered_convo_partner')) ?
  otherUser.preferences.get('not_prefered_convo_partner').includes(initiatingUser.user_id) : false
}

const createGroupsByGroupSize = (users) => {
  let start = 0
  const newUsersGroup = []

  console.log(start, 'start')


  while (start < users.length) {
    const maxGroup = maxGroupSize(users[start])
    console.log(maxGroup, 'group max')
    let end = (maxGroup === 0) ? 3 : start + maxGroup // Always use 3 as the default max group size if any of the users in that group do not have it defined
    let subArray

    subArray = users.slice(start, end)

    if (subArray.length > 1) {
      newUsersGroup.push(subArray)
    } else {
      newUsersGroup[newUsersGroup.length - 1].push(...subArray)
    }
      start = end
  }
  return newUsersGroup
}

// 0:  [{users: [], 'non-prefered': []}]
// 1:  [{users: [], non-prefered: []}]
// [[{username: "Tolue", }, {}, {}], [{}], [2], [4]]
// {
//   "1": [],
//   "12434": ["12","123"],
//   "4-6": [],
//   "123456": ["12","123","1234","12345",...],
//   "7-9": [],
// }

// This is not used for now
const groupUsersByUnLikes = () => {
  const users = fixtureUsers
  let groups = {}
  users.map(user => {
    let count = 0
    while (count >= 0) {
      if (groups[count] && groups[count].users.length) {
        if (groups[count].unprefered.has(user.user_id) || (groups[count].users.filter(groupedUser => user.preferences && user.preferences.not_prefered_convo_partner ? user.preferences.not_prefered_convo_partner.includes(groupedUser.user_id) : false)).length) {
          count += 1
        } else {
          console.log('in here second ===========')
          groups[count].users.push(user)
          if (user.preferences.not_prefered_convo_partner) {
            user.preferences.not_prefered_convo_partner.forEach((unpreferedUser) => groups[count].unprefered.add(unpreferedUser))
          }
          count = -1
        }
      } else {
        console.log('first time')
        groups[count] = {users: [user], unprefered: user.preferences.not_prefered_convo_partner ? new Set(user.preferences.not_prefered_convo_partner) : new Set([])}
        count = -1
      }
    }
  })
  console.log(JSON.stringify(groups), 'groups******')
}

/**
 * Get the max group size of a group containing users using the upper bound of the users' preferred group size
 * @param {Object} group
 */
const getGroupMaxSize = (group) => {
  let maxSize = 0
  group.users.forEach(user => {
    maxSize =  Math.max(maxSize, maxGroupSize(user))
  })
  return maxSize
}

const maxGroupSize = (user) => {
  if (user.preferences && user.preferences.has('prefered_group_size')) {
    if (user.preferences.get('prefered_group_size') !== 'Flexible') {
      return Math.max(...(user.preferences.get('prefered_group_size').split('-').map(size => parseInt(size))))
    }
    return 3 // default group size
  }
  return 3
}


/**
 *
 * @param {Array} users
 * This is the major algorithm that tries to ensure users who don't like each other are not grouped together and
 * gives preferences for those a user likes. Note that, this algorithm is not perfect, just reduces the likelihood that
 * users don't get grouped with someone they specified they didn't like
 */
const groupByLikesAndUnlikes = (users) => {
  const groups = {}

  users.map((user) => {
    let count = 0
    while(count >= 0) {
      if (groups[count] && groups[count].users.length) {
        if (groups[count].users.length === 3) {
          count += 1
        } else {
          if (groups[count].prefered.has(user.user_id) && !(groups[count].unprefered.has(user.user_id))) {
            groups[count].users.push(user)
            if (user.preferences && user.preferences.has('prefered_convo_partner')) {
              user.preferences.get('prefered_convo_partner').forEach((preferedUser) => groups[count].prefered.add(preferedUser))
            }
            if (user.preferences.has('not_prefered_convo_partner')) {
              user.preferences.get('not_prefered_convo_partner').forEach((unpreferedUser) => groups[count].unprefered.add(unpreferedUser))
            }
            count = -1
          } else {
            count += getGroupMaxSize(groups[count])
          }
        }
      } else {
        console.log('first time')
        groups[count] = {
          users: [user],
          unprefered: user.preferences && user.preferences.get('not_prefered_convo_partner') ? new Set(user.preferences.get('not_prefered_convo_partner')) : new Set([]),
          prefered: user.preferences && user.preferences.get('prefered_convo_partner') ? new Set(user.preferences.get('prefered_convo_partner')) : new Set([])
        }
        count = -1
      }
    }
  })
  let result = []
  Object.values(groups).forEach(group => result = result.concat(group.users))
  return result
}


module.exports = {matchUser, checkAcceptedUsers, matchFromCron, createGroupsByGroupSize, groupByLikesAndUnlikes}