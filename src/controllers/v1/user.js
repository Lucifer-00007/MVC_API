const credentials = require("../../config/firebase-config-v1.1.json");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    // initialized firebase app.
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    })
} else {
    // if already initialized.
    admin.app();
}
const db = admin.firestore();

const UserController = {
    getUserMain: async (req, res) => {
        try {
            const user = db.collection('users');

            // const { userId } = req.query
            // if (!userId) {
            //     throw new Error("userId is missing in query!");
            // }

            // if (!user) {
            //     throw new Error("No User Found!");
            // }
            const users = await user.get();
            
            const allUsers = [];

            users.forEach(doc => {
                allUsers.push(doc.data())
                // console.log(doc.data());
            })

            res.status(200).json({ success: true, data: allUsers});
        } catch (err) {
            res.status(400).json({ success: false, error: { message: err.message } })
        }
    },
}

module.exports = UserController;