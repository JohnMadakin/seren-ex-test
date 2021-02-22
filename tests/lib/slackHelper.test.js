const chai = require('chai')
const expect = chai.expect

const slackHelper = require('../../src/lib/slackHelper')

describe('slackHelper', () => {
  describe('joinChannels', () => {
    it('should return the joined channels names', () => {
      expect(slackHelper.joinChannels(['YU6827H', 'UXDR578'])).to.equal('<#YU6827H>,<#UXDR578>')
    })
  })

  describe('channelName', () => {
    it('returns the right format for the channel names', () => {

      expect(slackHelper.channelName()).to.match(/seren-[0-9]{4}-[0-9]{3}/)
    })
  })

  describe('processDirectMessage', () => {
    const context = {
      event: {
        type: ''
      }
    }

    
    describe('when message has help', () => {
      let user;
      describe('without user', () => {
        it('returns the correct message block', () => {
          const result = slackHelper.processDirectMessage(context, 'help me', user)

          expect(result[0]['q']).to.equal('1.`/seren help` (gets all commands available). \n' +
          ' 2.`/seren hi` (helps you setup seren up privately) \n' +
          ' 3. `/seren update` (helps update your preferences) \n' +
          '4. `/seren create_meeting <username> <username>` or `cm <username> <username>` (creates a group with a meeting link with the list of specified users) \n' +
          '5.`/seren sms` (prompts you to enter your phone number and subscribes to SMS notifications) ')
        })
      })
      
    })
  })
})