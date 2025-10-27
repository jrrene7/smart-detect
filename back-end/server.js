require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser"); // latest version of exressJS now comes with Body-Parser!
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");

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

// Test only - when you have a database variable you want to use
// app.get('/', (req, res)=> {
//   res.send(database.users);
// })

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => res.status(400).json("unable to get user"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch((err) => res.status(400).json("wrong credentials"));
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            // If you are using knex.js version 1.0.0 or higher this now returns an array of objects. Therefore, the code goes from:
            // loginEmail[0] --> this used to return the email
            // TO
            // loginEmail[0].email --> this now returns the email
            email: loginEmail[0].email,
            name: name,
            joined: new Date(),
          })
          .then((user) => {
            res.json(user[0]);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("unable to register"));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({ id })
    .then((user) => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json("Not found");
      }
    })
    .catch((err) => res.status(400).json("error getting user"));
});

app.post("/api/clarifai/face-detect", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const raw = JSON.stringify({
      user_app_id: {
        user_id: "clarifai",
        app_id: "main",
      },
      inputs: [
        {
          data: { image: { url: imageUrl } },
        },
      ],
    });

    const clarifaiRes = await fetch(
      "https://api.clarifai.com/v2/models/face-detection/outputs",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Key " + process.env.PAT,
          "Content-Type": "application/json",
        },
        body: raw,
      }
    );

    const data = await clarifaiRes.json();
    res.json(data);
  } catch (error) {
    console.error("Clarifai API error:", error);
    res.status(500).json({ error: "Clarifai request failed" });
  }
});
app.put("/image", (req, res) => {
  console.log("/image endpoint hit");
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      // If you are using knex.js version 1.0.0 or higher this now returns an array of objects. Therefore, the code goes from:
      // entries[0] --> this used to return the entries
      // TO
      // entries[0].entries --> this now returns the entries
      res.json(entries[0].entries);
    })
    .catch((err) => res.status(400).json("unable to get entries"));
});

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
