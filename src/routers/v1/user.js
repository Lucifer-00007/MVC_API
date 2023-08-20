const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/v1/user");


router.post("/allUsers", UserController.getAllUsers);

module.exports = router;