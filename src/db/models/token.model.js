const {Schema, model} = require('mongoose');

const TokenSchema = new Schema({
  token: {
    type: String,
    required: true,
  },
  whroolerId: {
    type: String,
    //required:true,
  },
  //add expires time if possible base on token life time.
  date: {
    type: Date,
    default: Date.now,
  },
},
{
  timestamps: true,
});


const Token = model("token", TokenSchema);

module.exports = Token;