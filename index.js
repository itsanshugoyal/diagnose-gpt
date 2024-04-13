const express = require("express");
const http = require("http");
const User = require("./model/user");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;

const socketIo = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const cors = require("cors");

const app = express();
require("dotenv").config();
const server = http.createServer(app);
app.use(cors()); // Add cors middleware

const io = new socketIo.Server(server, {
  cors: {
    origin: "http://localhost:4005",
    methods: ["GET", "POST"],
  },
});

/* mongoose connection */

const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const mongoString = "mongodb+srv://itsanshugoyal:anshu@cluster0.vcpoxfg.mongodb.net/";
const connect = mongoose.connect(mongoString);
const db = mongoose.connection;

// Check database connected or not
connect
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.log(err);
    console.log("Database cannot be Connected");
  });

/*
  Session configuration and utilization of the MongoStore for storing
  the session in the MongoDB database
*/
app.use(express.json());

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongoUrl: db.client.s.url }),
  })
);

/*
  Setup the local passport strategy, add the serialize and 
  deserialize functions that only saves the ID from the user
  by default.
*/
const strategy = new LocalStrategy(User.authenticate());
passport.use(strategy);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};
checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
};

app.get("/", checkAuthenticated, (req, res) => {
  res.render("home.ejs", { name: req.user.name });
});

/* about */
app.get("/about", (req, res) => {
  res.render("aboutus");
});

/* about */
app.get("/contact", (req, res) => {
  res.render("contactus");
});

/* medical query */

app.get("/medicalquery", (req, res) => {
  res.render("gpt");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GPTAPI;
    // const prompt = document.getElementById("input_symp").value;
    const endpoint = "https://api.openai.com/v1/chat/completions";
    // Send user message to ChatGPT API
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    };

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        res.status(200).json({ reply: data.choices[0].message.content });
      });
  } catch (error) {
    console.log("🚀 ~ file: index.js:39 ~ app.post ~ error:", error);
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.post("/medicalquery", (req, res) => {});

/* login */
app.get("/login", checkLoggedIn, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/",
  }),
  (err, req, res, next) => {
    if (err) next(err);
  }
);

/* signup */

app.get("/signup", checkLoggedIn, (req, res) => {
  res.render("signup.ejs");
});

app.post("/signup", function (req, res) {
  User.register(
    new User({
      email: req.body.email,
      username: req.body.username,
    }),
    req.body.password,
    function (err, msg) {
      if (err) {
        res.send(err);
      } else {
        // res.send({ message: "Successful" });
        res.redirect("/");
      }
    }
  );
});

/* logout */

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

/* chat room */

app.get("/chat", (req, res) => {
  res.render("chatpage");
});

const botName = "GANDU";

// run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to XeroxChat!"));

    // broadcast when a user connects
    socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the chat!`));

    // send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // runs when clients disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat!`));

      // send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

/* server start */
const PORT = process.env.PORT || 4005;
server.listen(PORT, () => {
  console.log(`🎯 Server is running on PORT: ${PORT}`);
});
