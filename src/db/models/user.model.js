const { Schema, model } = require("mongoose");
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
const Token = require("./token.model");

/**
 * End User Schema
 */
const UserSchema = new Schema({
    userId: {
        //ZOC _ _ _ _ _ _ _
        type: String,
        minlength: 10,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    phone: {
        type: String,
        unique: true,
        required: true,
        minlength: 10,
        maxlength: 15,
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    pin: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        max: 60,
        min: 18,
        default: 18
        //required:true
    },
    gender: {
        type: String,
        required: true,
        enum: {
            values: ["MALE", "FEMALE", "OTHER"],
            message: '{VALUE} is not supported!'
        },
        default: "OTHER",
    },
    profilePic: {
        img: {
            type: String,
            default: "",
        },
        tempImg: {
            type: String,
            default: "",
        },
        temp_img_status: {
            type: String,
            required: true,
            enum: {
                values: ["DEFAULT", "UNDER_VALIDATION", "ACCEPTED", "REJECTED", ""]
            },
            default: "DEFAULT"
        },
        status: {
            type: String,
            required: true,
            enum: {
                values: ["DEFAULT", "UNDER_VALIDATION", "ACCEPTED", "REJECTED", ""]
            },
            default: "DEFAULT"
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        remarks: {
            type: String,
            default: "Ok"
        }
    },
    loginAttempts: {
        type: String,
        default: "0",
    },
    creationDate: {
        type: Date,
        default: new Date(),
    }
},
    {
        timestamps: true
    });



UserSchema.methods = {
    //UserSchema Instance Method to generate access token
    createAccessToken: async function () {
        try {
            let { _id, userId, email, gender } = this;
            let accessToken = jwt.sign(
                { user: { _id, userId, email, gender } },
                ACCESS_TOKEN_SECRET,
                {
                    expiresIn: "7d"
                }
            );
            return `Bearer ${accessToken}`;
        } catch (err) {
            console.log({ status: false, message: err.message })
            return new Error(`Unable to generate access token! ${err.message}`);
        }
    },
    //UserSchema Instance Method to generate refresh token and save into database
    createRefreshToken: async function () {
        try {
            let { _id, userId, email, gender } = this;
            let refreshToken = jwt.sign(
                { user: { _id, userId, email, gender } },
                REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "90d"
                }
            );
            await new Token({ token: refreshToken, userId }).save();
            return `Bearer ${refreshToken}`;
        } catch (err) {
            console.log({ status: false, message: err.message })
            return new Error(`Unable to generate refresh token! ${err.message}`);
        }
    }
};


/**
* End User Model
 */
const User = model("user", UserSchema);



module.exports = User;