const express = require("express");
const router = express.Router();
const multer = require("multer");
const DriverUpload = require("../../controllers/v1/driverPicUpload");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//To upload all driver Photos at once.
router.get("/combUp", upload.single("selfPhoto"), DriverUpload.combinedUpload);

//To upload driver self Photo.
router.get("/selfPhoto", upload.single("selfPhoto"), DriverUpload.selfPhoto);

//To upload driver aadhar front.
router.get("/aadharFront", upload.single("aadharFront"), DriverUpload.aadharFront);

//To upload driver aadhar back.
router.get("/aadharBack", upload.single("aadharBack"), DriverUpload.aadharBack);

module.exports = router;

