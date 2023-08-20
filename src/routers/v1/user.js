const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/v1/user");

//To get All users 
router.get("/allUsers", UserController.getAllUsers);

//To get Specific user using userId
router.get("/user", UserController.getUser);


//To edit Specific user profile using userId
router.post("/editProfile", UserController.editProfile);

//To Change user pin
router.post("/changePin", UserController.changePin);

//To delete one user
router.delete("/deleteOneUser/:userId", UserController.deleteOneUser);

//To delete many users
router.delete("/deleteOneUser/:userId", UserController.deleteManyUsers);

module.exports = router;