const { ENCRYPTION_KEY } = process.env;
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { User, VerificationRequest, Token, } = require("../../db/models");
const { loginValidation, resetPasswordValidation, registerValidation, verifyOtpValidation,
} = require("../../validators")
const { symmetricDecrypt, symmetricEncrypt } = require("../../libs/crypto");
const { AddMinutesToDate } = require("../../libs/time");
const slugify = require("../../libs/slugify");
const { sendSignupConfirmationOtp, sendResetPinOtp, } = require("../../emails/emailManager");

const AuthenticationController = {
	//User Signup Api
	signupUser: async (req, res) => {
		try {
			// VALIDATE USER DATA BEFORE CREATING
			const { error } = await registerValidation(req.body);
			if (error) throw new Error(error.details[0].message);

			// Request Body
			const { name, email, phone, pin, emailOtp, verification_key } = req.body;

			// Checking if user is already in database using email
			const emailExist = await User.findOne({ email });
			if (emailExist) throw new Error("Phone Number Or Email Already Exist!");

			// Checking if user is already in database using phone
			const phoneExist = await User.findOne({ phone });
			if (phoneExist) throw new Error("Phone Number Or Email Already Exist!");

			let decoded = symmetricDecrypt(verification_key, ENCRYPTION_KEY);
			let obj = await JSON.parse(decoded);

			if (obj.check !== email) throw new Error("InCorrect Email!");

			//--------------------------------------------------------
			//Checking email OTP in DB
			const otpExist = await VerificationRequest.findById({ _id: obj.otp_id });
			if (!otpExist) throw new Error("otp-not-found");

			//Checking if OTP is already used or not
			if (otpExist.isVerified) throw new Error("otp-already-used");

			//Checking if OTP is equal to the OTP in DB
			if (emailOtp !== otpExist.otp) throw new Error("incorrect-email-otp");
			//Mark OTP as verified or used
			otpExist.isVerified = true;
			await otpExist.save();

			// Hash passwords
			const salt = await bcrypt.genSalt(10);
			//using pin as password
			const hashedPin = await bcrypt.hash(pin, salt);

			// CREATE NEW USER
			const newUser = await new User({
				userId: `${Math.floor(new Date())}${phone}`,
				name: name,
				email: email.toLowerCase(),
				phone: phone,
				pin: hashedPin,
				isEmailVerified: true,
			});

			//const createdUser = await user.save();
			let accessToken = await newUser.createAccessToken();
			let refreshToken = await newUser.createRefreshToken();

			//saving the newUser
			await newUser.save();

			//deleting pin
			delete newUser.pin;
			res.status(200).json({ success: true, data: { accessToken, refreshToken, user: newUser }, });
		} catch (err) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}
	},

	//User Login Api
	loginUser: async (req, res) => {
		const { email, pin } = req.body;

		try {
			const { error } = await loginValidation(req.body);
			if (error) throw new Error(error.details[0].message);

			const user = await User.findOne({ email });
			if (!user) throw new Error("User Not Found!");

			let loginAttempts = user.loginAttempts;

			if (parseInt(loginAttempts) >= 5) {
				throw new Error("Login Attempts Exceeded! Account Blocked.!");
			}

			const isValidPin = await bcrypt.compare(pin, user.pin);
			if (!isValidPin) {
				user.loginAttempts = `${parseInt(loginAttempts) + 1}`
				await user.save();
				throw new Error(`Invalid Pin! ${5 - parseInt(user.loginAttempts)} Attempts Left. `);
			}
			//Resetting login Attempts if login successfully.
			user.loginAttempts = "0";
			await user.save();

			let accessToken = await user.createAccessToken();
			let refreshToken = await user.createRefreshToken();

			//Converting Mongdb Object to Javascript Object
			let newUser = user.toJSON();
			//deleting pin from user object;
			delete newUser.pin;

			res.status(200).json({
				success: true,
				data: {
					accessToken,
					refreshToken,
					user: newUser
				},
			});
		} catch (err) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}
	},

	//To send otp to phone number
	sendPhoneOtp: async (req, res) => {
		try {
			const { userId, mobile_no, } = req.body;
			if (!userId || !mobile_no) {
				throw new Error("userId or mobile_no is missing in body!");
			}

			//Generate OTP
			const otp = Math.floor(Math.random() * 100000) + 100000;
			const now = new Date();
			
			//Otp expiration time
			const expiration_time = AddMinutesToDate(now, 2)

			res.status(200).json({ success: true, data: `OTP ${otp} SEND SUCCESS TO ${mobile_no}!` });
		} catch (error) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}

		// try {
		// 	const { userId, mobile_no, route = "TRANS", template_id = "1507165881627095157" } = req.body;

		// 	if (!userId || !mobile_no) {
		// 		throw new Error("userId or mobile_no is missing in body!");
		// 	}

		// 	//Generate OTP
		// 	const otp = Math.floor(Math.random() * 100000) + 100000;
		// 	const now = new Date();
		// 	//Otp expiration time
		// 	const expiration_time = AddMinutesToDate(now, 2);

		// 	//Create VerificationRequest Instance in DB
		// 	const vr = await VerificationRequest.create({
		// 		otp,
		// 		expires: expiration_time,
		// 	});

		// 	//details object containing the email and vr id
		// 	const details = {
		// 		timestamp: now,
		// 		check: mobile_no,
		// 		status: "success",
		// 		message: "OTP SMS Sent Successfully to User Mobile Number.",
		// 		otp_id: vr._id,
		// 	};

		// 	//Encrypting details Object
		// 	const encoded = symmetricEncrypt(JSON.stringify(details), ENCRYPTION_KEY);

		// 	const newMobile_no = mobile_no.length > 10 ? mobile_no.substring(2) : mobile_no
		// 	const { status, message } = await axios.get(`https://www.alots.in/sms-panel/api/http/index.php?username=${SMS_ACCOUNT_NAME}&apikey=${SMS_API_KEY}&apirequest=Text&sender=${SMS_SENDER_ID}&mobile=${newMobile_no}&message=Dear,
		//   Its your Whrool otp ${otp} valid for 2 minutes.
		//   Do not share with anyone.&route=${route}&TemplateID=${template_id}&format=JSON`);

		// 	if (status === "error") {
		// 		throw new Error(message);
		// 	}

		// 	res.status(200).json({ success: true, data: encoded, message });
		// } catch (err) {
		// 	console.log(err);
		// 	res.status(400).json({ success: false, error: { message: err.message } });
		// }
	},

	//To send otp to email
	sendEmailOtp: async (req, res) => {
		try {
			const { email, type } = req.body;
			//input data validation
			if (!email || !type) {
				throw new Error("Email or Type missing in body!");
			}

			//Generate OTP
			const otp = Math.floor(Math.random() * 100000) + 100000;
			const now = new Date();
			//Otp expiration time
			const expiration_time = AddMinutesToDate(now, 2);

			//Create VerificationRequest Instance in DB
			const vr = await VerificationRequest.create({
				otp,
				expires: expiration_time,
			});
			await vr.save();

			//details object containing the email and vr id
			const details = {
				timestamp: now,
				check: email,
				status: "success",
				message: "OTP sent to user email address.",
				otp_id: vr._id,
			};
			//Encrypting details Object
			const encoded = symmetricEncrypt(JSON.stringify(details), ENCRYPTION_KEY);

			//email payload
			const emailPayload = {
				to: email.includes(".whl") ? "whrool21@gmail.com" : email,
				otp: slugify(otp.toString()),
				name: "Rider",
			};

			if (type === "SIGNUP") {
				//Signup Confirmation otp email
				const sentMail = await sendSignupConfirmationOtp(emailPayload);
			} else if (type === "RESET_PASSWORD") {
				//Reset Password confirmation otp email
				const sentMail = await sendResetPinOtp(emailPayload);
			} else {
				//Incorrect email type error
				throw new Error("Invalid email type providedin body!");
			}

			res.status(200).json({ success: true, data: encoded });
		} catch (err) {
			console.log(err);
			res.status(400).json({ success: false, error: { message: err.message } });
		}
	},

	//To verify otp email/phone
	verifyOtp: async (req, res) => {
		try {
			const { verification_key, otp, check, userId, type = "" } = req.body;

			if (!userId, !verification_key || !otp || !check) {
				throw new Error("userId, Otp, check or verification_key is missing in body!");
			}

			// VALIDATE USER DATA BEFORE CREATING
			const { error } = await verifyOtpValidation(req.body);
			if (error) throw new Error(error.details[0].message);

			//Decoding verification_key
			let decoded = symmetricDecrypt(verification_key, ENCRYPTION_KEY);
			let obj = await JSON.parse(decoded);

			if (obj.check != check) throw new Error("Incorrect check email or phone!");

			//--------------------------------------------------------
			//Checking email OTP in DB
			const otpExist = await VerificationRequest.findById({ _id: obj.otp_id });
			if (!otpExist) {
				throw new Error("otp-not-found");
			}

			//Checking if OTP is already used or not
			if (otpExist.isVerified) {
				throw new Error("otp-already-used");
			}

			//Checking if OTP is equal to the OTP in DB
			if (otp !== otpExist.otp) {
				throw new Error("Incorrect Otp!");
			}

			//Mark OTP as verified or used
			otpExist.isVerified = true;
			await otpExist.save();

			if (type === "MOBILE_VERIFICATION") {
				//mark mobile as verified in db
				await User.findOneAndUpdate({ userId }, { isPhoneVerified: true });
			}

			if (type === "EMAIL_VERIFICATION") {
				//mark email as verified in db
				await User.findOneAndUpdate({ userId }, { isEmailVerified: true });
			}

			res.status(200).json({ success: true, data: { message: "Otp Verified." } });
		} catch (err) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}
	},

	//To Reset User Password works with otp api
	resetPin: async (req, res) => {
		try {
			//Request Body
			const { email, pin, verification_key } = req.body;
			if (!email || !pin || !verification_key) {
				throw new Error("Email , Pin, or verification_key is missing in body!");
			}

			// VALIDATE USER DATA BEFORE CREATING
			const { error } = await resetPasswordValidation(req.body);
			if (error) throw new Error(error.details[0].message);

			//Decoding Vertification Key
			let decoded = symmetricDecrypt(verification_key, ENCRYPTION_KEY);
			let obj = await JSON.parse(decoded);

			if (obj.check != email) throw new Error("incorrect-email-otp");

			//Hash passwords
			const salt = await bcrypt.genSalt(10);
			//using pin as password
			const hashedPin = await bcrypt.hash(pin, salt);

			const user = await User.findOneAndUpdate(
				{ email },
				{ pin: hashedPin, loginAttempts: "0" }
			);

			//console.log(user);
			if (!user) throw new Error("user-not-found");

			res
				.status(200)
				.json({ success: true, data: { message: "Pin reset successfully!" } });
		} catch (err) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}
	},

	//User Logout Api
	logout: async (req, res) => {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				throw new Error("token is missing in body!");
			}
			const token = refreshToken.split(" ")[1];

			const FindToken = await Token.findOne({ token });
			if (!FindToken) {
				throw new Error("Token not found!");
			}

			const { deletedCount } = await Token.deleteOne({ token });
			if (deletedCount < 1) {
				throw new Error("Unable to delete token!");
			}

			res
				.status(200)
				.json({ success: true, data: { message: "Logged Out Successfully." } });
		} catch (err) {
			res.status(400).json({ success: false, error: { message: err.message } });
		}

	},
}


module.exports = AuthenticationController;
