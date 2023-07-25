
// To add minutes to the current time
function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes*60000);
}

/**
 * To add days to the current/given date
 * @returns new `Date` object with the days added
 */
function AddDaysToDate(date, days) {
  return new Date(date.getTime() + days*86400000);
}


module.exports={AddMinutesToDate,AddDaysToDate};