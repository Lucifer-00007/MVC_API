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

//To signup driver
// router.post("/signupDriver", upload.single("image-file"), AuthenticationController.signupDriver);
router.post("/signupDriver", AuthenticationController.signupDriver);

//To login user
router.post("/loginUser", AuthenticationController.loginUser);

//To login driver
router.post("/loginDriver", AuthenticationController.loginDriver);

//To check whether email and phone exist while signup
router.post("/verify-email-phone", AuthenticationController.verifyEmailAndPhone);

//To check whether email exist or not
router.post("/check-email-exist", AuthenticationController.checkEmailExist);

//To send Email Otp
router.post("/email/send-otp", AuthenticationController.sendEmailOtp);

//To send Phone Otp
router.post("/phone/send-otp", AuthenticationController.sendPhoneOtp);

//To verify otp
router.post("/verify-otp", AuthenticationController.verifyOtp);

//To logout user
router.post("/logout", AuthenticationController.logout);


module.exports = router;