const mongoose = require('mongoose');

const connectToDatabase = async (url) => {
  try {
    mongoose.set('strictQuery', false)
    mongoose.connect(url)
    console.log({ message:'Mongo connected!' })
  }
  catch (error) {
    console.log({message: 'Error while connecting to database.', err: error})
    process.exit()
  }
}

module.exports = { connectToDatabase }


