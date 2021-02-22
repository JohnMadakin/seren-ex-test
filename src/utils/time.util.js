const moment = require('moment');

const isValidDate = (date)=> moment(date).isValid();

const futureDate = (date)=>{
    return moment(date).format('yyyy-MM-dd HH:mm:ssZ')
}

const scheduleMeetingNow = ()=>{
    return moment().format('yyyy-MM-dd HH:mm:ssZ')
}

const meetingDuration = () => {
    return 45;
}

const now = () => {
    return moment().format();
}

const zoomTokenExpiryTime = (seconds)=>{
    const durationInMinutes = moment.duration(seconds).asMinutes();

    const expiry = moment().add(durationInMinutes, 'minutes').format();

    return expiry;
}

const checkTokenExpiration = (expires_in)=>{
    const expired =  moment().isSameOrAfter(moment(expires_in));
    console.log("expired", expired)
}

module.exports = {
    scheduleMeetingNow, 
    meetingDuration, 
    isValidDate, 
    futureDate, 
    now, 
    zoomTokenExpiryTime,
    checkTokenExpiration
}