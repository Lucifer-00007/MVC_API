const {Schema, model} = require("mongoose");


/**
 * Verification Request Schema
 */
const VerificationRequestSchema = new Schema({
  isVerified:{
    type:Boolean,
    default:false,
  },

  otp:{
    type:String,
    required:true
  },
  expires:{
    type:Date,
    expires:0
  },
},
{
  timestamps:true
});

/**
 * Verification Request Model
 */
const VerificationRequest = model("verificationRequest", VerificationRequestSchema);

module.exports = VerificationRequest;