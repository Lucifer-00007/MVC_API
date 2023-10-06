const bcrypt = require("bcryptjs");
const { Admin } = require("../../db/models");
const { adminLoginValidation } = require("../../validators");

const AdminController = {
  //ADMIN SIDE
  all: async (req, res) => {
    try {
      const admins = await Admin.find({});
      if (!admins) throw new Error("no admin found!");
      res.status(200).json({ success: true, data: admins });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  add: async (req, res) => {
    try {
      const { name, password } = req.body;
      const { error } = await adminLoginValidation(req.body);
      if (error) throw new Error(error.details[0].message);
      // Checking if user is already in database using email
      const admin = await Admin.findOne({ name });
      if (admin) throw new Error("admin-already-exist!"); //ADD redirection to Signup page

      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      //using pin as password
      const hashedPassword = await bcrypt.hash(password, salt);
      // CREATE NEW ADMIN
      const newAdmin = await Admin.create({
        name: name,
        password: hashedPassword,
      });

      res.status(200).json({ success: true, data: newAdmin });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  edit: async (req, res) => {
    try {
        const {adminId} = req.params;
        if(!adminId) throw new Error('adminId missing in params!');
        const {roles} = req.body;
        if(!roles || roles?.length===0) throw new Error('no roles defined!');
        //Currently only roles editable
        let newRoles = {};
        roles.includes('creation')?newRoles.creation=true:newRoles.creation=false
        roles.includes('support')?newRoles.support=true:newRoles.support=false
        roles.includes('validator')?newRoles.validator=true:newRoles.validator=false
        roles.includes('roboticChat')?newRoles.roboticChat=true:newRoles.roboticChat=false
        roles.includes('marketing')?newRoles.marketing=true:newRoles.marketing=false
        roles.includes('accountant')?newRoles.accountant=true:newRoles.accountant=false
        const newAdminRoles = await Admin.findByIdAndUpdate(adminId,newRoles,{new:true});
        if(!newAdminRoles) throw new Error("unable to update admin roles!");
        res.status(200).json({ success: true, data: newAdminRoles });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
  changePassword: async (req, res) => {
    try {
      const {currentPassword,newPassword,adminId} = req.body;
      if(!currentPassword || !newPassword || !adminId){
        throw new Error("currentPassword,newPassword or ")
      }

      const me = await Admin.findById(adminId).select("password");
      const validPassword = await bcrypt.compare(currentPassword, me.password);
      if(!validPassword){
        throw new Error("Incorrect Password!");
      }

      //Hash passwords
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword,salt);

      const user = await Admin.findByIdAndUpdate(adminId,{password:hashedPassword});

      res.status(200).json({success:true,data:"Password Changed Successfully."})
    } catch (err) {
      res.status(400).json({success:false,error:{message:err.message}})
    }
  },
  delete: async (req, res) => {
    try {
      const { adminId } = req.params;
      if (!adminId) throw new Error("adminId is missing in params!");
      const deletedAdmin = await Admin.findByIdAndDelete(adminId);
      if (!deletedAdmin) throw new Error("unable to delete admin!");

      res.status(200).json({ success: true, data: deletedAdmin });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message } });
    }
  },
};

module.exports = AdminController;
