const { User, Id, Interest, Profession, Qualification, City, } = require("../../db/models");
//const {toId} = require("../../db/helper");
const bcrypt = require('bcryptjs');


const UserController = {
  //CLIENT SIDE
  getUserProfile:async(req,res) => {
    try {
      const {userId} = req.query;
      if(!userId){
        throw new Error("userId is missing in query!");
      }
      // if (!isAuthenticated) throw new ApolloError(NotAllowed.message, NotAllowed.code);
      const user = await User.findById({ _id:userId })
      .select("_id name age gender email phone bio city profilePic coverPic interests qualification profession photo1 photo2 photo3 photo4 photo5");
      if(!user){ 
        throw new Error("User Not Found!");
      }
      await user.populate([
        {
          path: "qualification",
          model: Qualification,
          strictPopulate: false,
        },
        {
          path: "profession",
          model: Profession,
          strictPopulate: false,
        },
        {
          path: "interests",
          model: Interest,
          strictPopulate: false,
        },
        {
          path: "city",
          model: City,
          strictPopulate: false,
        },
      ]);

      //Converting Mongodb Object to Javascript Object
      let newUser = user.toJSON();
      // let photos = [newUser.photo1,newUser.photo2,newUser.photo3,newUser.photo4,newUser.photo5];
      let photos = [];
      if(newUser.photo1.img && newUser.photo1.img.length>5){
        photos.push(newUser.photo1)
      }
      if(newUser.photo2.img && newUser.photo2.img.length>5){
        photos.push(newUser.photo2)
      }
      if(newUser.photo3.img && newUser.photo3.img.length>5){
        photos.push(newUser.photo3)
      }
      if(newUser.photo4.img && newUser.photo4.img.length>5){
        photos.push(newUser.photo4)
      }
      if(newUser.photo5.img && newUser.photo5.img.length>5){
        photos.push(newUser.photo5)
      }
      delete newUser.photo1;
      delete newUser.photo2;
      delete newUser.photo3;
      delete newUser.photo4;
      delete newUser.photo5;
      newUser.photos = photos;

      //console.log("population: ",user);
      res.status(200).json({ success: true, data: newUser });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getUser: async (req, res) => {
    try {
      const { userId, email } = req.query;
      
      if(userId){
        const user = await User.findOne({ userId },{pin:0});
        if (!user) {
          throw new Error("User Not Found!");
        }
        res.status(200).json({ success: true, data: user });
        return;
      }
      if(email){
        const user = await User.findOne({ email },{pin:0});
        if (!user) {
          throw new Error("User Not Found!");
        }
        res.status(200).json({ success: true, data: user });
        return;
      }      

      if(!userId || !email){
        throw new Error("userId or email is missing in query!")
      }
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const allUsers = await User.find();
      res.status(200).json({ success: true, data: allUsers });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //EDIT PROFILE ACTIONS
  //TO edit user profile
  editProfile: async (req, res) => {
    try {
      const {userId, name, email, phone, age, gender} = req.body;
      if(!userId){
        throw new Error("userId is missing in body!");
      }

      let ChangeDetails = {}      
      if(name) ChangeDetails.name=name;
      if(email) ChangeDetails.email=email; ChangeDetails.isEmailVerified=false;
      if(phone) ChangeDetails.phone=phone; ChangeDetails.isPhoneVerified=false;
      if(age) ChangeDetails.age=age;
      if(gender) ChangeDetails.gender=gender;
      
      const user = await User.findOneAndUpdate({ userId }, ChangeDetails)

      res.status(200).json({ success: true, data: "Profile Updated" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },  
  //To edit user photos
  editPhotos: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "Photos Updated" });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //CHANGE USER PIN
  changePin: async (req, res) => {
    try {
      //VALIDATION CHECK
      const {currentPin, newPin, userId} = req.body;
      if(!currentPin || !newPin || !userId){
        throw new Error("currentPin, newPin or userId is missing in body!");
      }

      //LOGIC AND DB OPERATIONS
      const me = await User.findOne({ userId }).select("pin");
      const validPin = await bcrypt.compare(currentPin, me.pin);
      if(!validPin) throw new Error("Incorrect Pin!");

      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      //using pin as password
      const hashedPin = await bcrypt.hash(newPin, salt);

      const user = await User.findOneAndUpdate({ userId }, { pin:hashedPin });

      res.status(200).json({ success: true, data: {message:"Pin Changed Successfully."} });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //DELETE USER
  //To Delete One user
  deleteOneUser: async (req, res) => {
  try {
      const { userId, } = req.params;
      if(!userId){
        throw new Error("userId is missing in body!");
      }
      const deleteUser = await User.deleteOne({ userId: userId.toString() });
      res.status(200).json({ success: true, data: "One user delete successfully!", deleteUser });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },

  //To Delete many users
  deleteManyUsers: async (req, res) => {
    try {
      res.status(200).json({ success: true, data: "deleteUser" });
      } catch (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
      }
    },
  
};

module.exports = UserController;
