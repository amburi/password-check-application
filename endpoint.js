var express = require("express");
var app = express();
const filesync = require("fs");
var parser = require("body-parser");
app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

// password check rules are defined at configuration.json
// get all password check rules
var rulesValidPassword = JSON.parse(
  filesync.readFileSync("configuration.json", "utf8")
);

/**
 * Server
 */
var server = app.listen("3000", "localhost", function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log("Server is running at http://%s:%s", host, port);
});

/**
 * Password Check API
 */
app.post("/", function (req, res) {
  let errorMsgs = [];
  let password = req.body.password;

  // validate passwords
  if (rulesValidPassword.length > 0) {
    for (let rule of rulesValidPassword) {
      let regex = new RegExp(rule.rex, "g");
      if (!password.match(regex)) {
        errorMsgs.push(rule.error);
      }
    }
  }

  // error case
  if (errorMsgs.length > 0) {
    res.status(400);
    res.json({ statusMessage: errorMsgs });
  }
  // success case
  else {
    res.status(204);
    res.json({ statusMessage: "success" });
  }
});
