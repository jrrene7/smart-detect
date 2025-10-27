require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

const signin = require("./controllers/signin");
const register = require("./controllers/register");
const profile = require("./controllers/profile");
const image = require("./controllers/image");
const clarifai = require("./controllers/clarifai");

const db = knex({
  // Enter your own database information here based on what you created
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "j-r",
    password: "",
    database: "smart-detect",
  },
});

const app = express();
app.use(cors()); // Enable CORS for all routes

// console.log(db.select("*").from("users").then(data => console.log(data)));

app.use(express.json()); // latest version of exressJS now comes with Body-Parser!

app.post("/signin", signin.handleSignin(db, bcrypt));
app.post("/register", register.handleRegister(db, bcrypt));
app.get("/profile/:id", profile.handleProfileGet(db));
app.put("/image", image.handleImage(db));
app.post("/api/clarifai/face-detect", clarifai.handleClarifaiCall());

//checking database connection
db.raw("SELECT 1+1 AS result")
 .then((response) => {
    console.log("Database connection successful: ", response.rows[0].result);
  })
 .catch((err) => {
    console.error("Unable to connect to the database: ", err.message);
  });

app.listen(3000, () => {
  console.log("Smart Detect API is running on port 3000");
});
