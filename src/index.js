require("dotenv").config();
const express = require("express");
const app = express()
const port = process.env.PORT || 3007

app.use(express.json());
app.use(express.urlencoded({extended: true}));


//Routes Controllers
const auth_routes = require("./routers/v1/auth");
const user_routes = require("./routers/v1/user");
const driverUp_routes = require("./routers/v1/driverPicUpload");

//Database Connection
const {connectToDatabase} = require("./db/connection/connection");
connectToDatabase(process.env.LOCAL_MONGO_URL)

//AUTH ROUTES
app.use("/api/v1/auth", auth_routes);

//USER ROUTES
app.use("/api/v1/user", user_routes);

//DRIVER UPLOAD ROUTES
// app.use("/api/v1/driverUp", driverUp_routes);

app.listen(port, () => {
    console.log(`Server started on port: ${port}`)
})