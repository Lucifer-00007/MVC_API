const express = require("express");
const router = express.Router();
const AuthenticationController = require("../../controllers/v1/auth");
// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./upload");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
// const upload = multer({ storage: storage });


//To signup user
router.post("/signupUser", AuthenticationController.signupUser);

//To login user
router.post("/loginUser", AuthenticationController.loginUser);

//To send Email Otp
router.post("/email/send-otp", AuthenticationController.sendEmailOtp);

//To send Phone Otp
router.post("/phone/send-otp", AuthenticationController.sendPhoneOtp);

//To verify otp
router.post("/verify-otp", AuthenticationController.verifyOtp);

//To reset pin
router.post("/reset-pin", AuthenticationController.resetPin);

//To logout user
router.post("/logout", AuthenticationController.logout);


module.exports = router;