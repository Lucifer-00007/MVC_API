const Joi = require('joi');

//Pending
//add regex for strict validations

/**
 * Joi Register Validation schema
 */
const registerSchema = Joi.object({
  name:Joi.string().min(3).max(15).required(),
  email:Joi.string().email({minDomainSegments:2}).required(),
  phone:Joi.string().min(10).max(15).required(),
  pin:Joi.string().min(6).max(6).required(),
  emailOtp:Joi.string().min(6).max(6).required(),
  verification_key:Joi.string().required(),
});

//register data validator
/**
 * @param {*} data
 */
const registerValidation = (data) => {
  return registerSchema.validateAsync(data);
}

//---------------------------------------------------------------------------------------------------------
//login schema
const loginSchema = Joi.object({
  email:Joi.string().email({minDomainSegments:2}).required(),
  pin:Joi.string().min(6).max(6).required(),
});

//login data validator
/**
 * @param {*} data
 */
const loginValidation = (data) => {
  return loginSchema.validateAsync(data);
}

//---------------------------------------------------------------------------------------------------------
//forgot Password schema
const resetPasswordSchema = Joi.object({
  email:Joi.string().email({minDomainSegments:2}).required(),
  pin:Joi.string().min(6).max(6).required(),
  verification_key:Joi.string().required(),
});

//forgot Password data validator
/**
 * @param {*} data
 */
const resetPasswordValidation = (data) => {
  return resetPasswordSchema.validateAsync(data);
}

//---------------------------------------------------------------------------------------------------------
//forgot Password schema
const verifyOtpSchema = Joi.object({
  //email:Joi.string().email({minDomainSegments:2}).required(),
  otp:Joi.string().min(6).max(6).required(),
  verification_key:Joi.string().required(),
  check:Joi.string().required(),
  userId:Joi.string().optional(),
  type:Joi.string().optional()
});

//forgot Password data validator
/**
 * @param {*} data
 */
const verifyOtpValidation = (data) => {
  return verifyOtpSchema.validateAsync(data);
}


//---------------------------------------------------------------------------------------------------------
//login schema
const adminLoginSchema = Joi.object({
  name:Joi.string().min(3).max(15).required(),
  password:Joi.string().min(8).max(15).required(),
});

//login data validator
/**
 * @param {*} data
 */
const adminLoginValidation = (data) => {
  return adminLoginSchema.validateAsync(data);
}




module.exports = {registerValidation,loginValidation,resetPasswordValidation, verifyOtpValidation, adminLoginValidation};