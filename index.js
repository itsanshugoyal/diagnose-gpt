const express = require("express");
const app = express();

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
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
