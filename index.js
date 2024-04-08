const express = require("express");
const app = express();
app.use(express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/aboutus.html");
});
app.get("/contact", (req, res) => {
  res.sendFile(__dirname + "/contactus.html");
});
app.get("/medicalquery", (req, res) => {
  res.sendFile(__dirname + "/gpt.html");
});

app.post("/login", (req, res) => {
  // Handle login post logic here
  const { username, password } = req.body;
  // Perform authentication logic here
  if (username === "admin" && password === "password") {
    res.send("Login successful");
  } else {
    res.send("Invalid credentials");
  }
});
app.post("/medicalquery", (req, res) => {});
app.listen(3001, () => {
  console.log("Server is running on port 3000");
});
