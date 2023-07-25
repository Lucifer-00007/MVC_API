const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/v1/user");


//get all users
router.get("/getAllUsers", UserController.getUserMain);


//get specific user
// router.post("/user", UserController.getUserMain);


module.exports = router;
