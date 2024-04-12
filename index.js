const express = require("express");
const collection = require("./src/config");
const bcrypt = require("bcrypt");
const http = require("http");

const passport = require("passport");
const initializePassport = require("./src/passport-config");
const { userInfo } = require("os");

const socketIo = require("socket.io");
const path = require("path");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const cors = require("cors");

// const server = require("http").createServer(app);
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

// app.io = require("socket.io")();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

/* home */
app.get("/", (req, res) => {
  res.render("home");
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
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      res.send("User name cannot found");
    }
    // Compare the hashed password from the database with the plaintext password
    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if (!isPasswordMatch) {
      res.send("wrong Password");
    } else {
      res.render("home");
    }
  } catch {
    res.send("wrong Details");
  }
});

/* signup */

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
  };

  // Check if the username already exists in the database
  const existingUser = await collection.findOne({ name: data.name });

  if (existingUser) {
    res.send("User already exists. Please choose a different username.");
  } else {
    // Hash the password using bcrypt
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; // Replace the original password with the hashed one

    const userdata = await collection.insertMany(data);
    console.log(userdata);
    res.redirect("/login");
  }
});

/* logout */

app.get("/logout", (req, res) => {
  req.logout(); // Logout the current user
  res.redirect("/"); // Redirect to the home screen
});
/* chat room */

app.get("/chat", (req, res) => {
  res.render("chatpage");
});
app.get("/chatroom", (req, res) => {
  res.render("chatroom");
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
