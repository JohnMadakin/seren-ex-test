const axios = require('axios').default;

const createSkypeMeeting = async () => {
    const result = await axios.post(
        `https://api.join.skype.com/v1/meetnow/createjoinlinkguest`,
        {
            "Title": `Seren Water cooler meeting` ,
        }, 
        {}
    );
    console.log(result, 'result')
    return result.data
}

module.exports = { createSkypeMeeting }