const admin = require("firebase-admin");
const credentials = require("../../config/firebase-config-v1.1.json");
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
	// Initialized Firebase App.
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    })    
}else {
    // If App Already Initialized.
    admin.app(); 
}
const db = admin.firestore();
const driver = db.collection('driver');

function createDirectories(pathname) {
    const __dirname = path.resolve();
   pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
   fs.mkdir(path.resolve(__dirname, pathname), { recursive: true }, e => {
       if (e) {
           console.error(e);
       } else {
           console.log(`${pathname} created!`);
       }
    });
}

const DriverUpload = {
    combinedUpload: async (req, res) => {
        try {
            // const { selfPhoto, aadharFront, aadharback } = req.file.path;
            // console.log(`selfPhoto>${selfPhoto} , aadharFront>${aadharFront} , aadharback>${aadharback}`)
            
            // const selfPhotoDetails = req.file;
            // console.log("req.file>", req.file);
            // res.status(200).json({ success: true, details:selfPhotoDetails,  data: `${req.file.originalname} is uploaded to ${req.file.path}!` });        
        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } });
        }
    },

    selfPhoto: async (req, res) => {
        try {            
            const  selfPhotoDetails = req.file;
            
            //Create new directory with timestamp as name, if not available.
            // const now = new Date();
            // const udt = Math.floor(now.getTime());
            // createDirectories(`./upload/${udt}`);

            res.status(200).json({ success: true, details:selfPhotoDetails,  data: `${req.file.originalname} is uploaded to ${req.file.path}!` });
        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } });
        }
    },

    aadharFront: async (req, res) => {
        try {
            const  aadharFrontDetails = req.file;
            res.status(200).json({ success: true, details:aadharFrontDetails,  data: `${req.file.originalname} is uploaded to ${req.file.path}!` });
        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } });
        }
    },

    aadharBack: async (req, res) => {
        try {
            const  aadharBackDetails = req.file;
            res.status(200).json({ success: true, details:aadharBackDetails,  data: `${req.file.originalname} is uploaded to ${req.file.path}!` });            
        } catch (error) {
            res.status(400).json({ success: false, error: { message: error.message } });            
        }
    }
}

module.exports = DriverUpload;
