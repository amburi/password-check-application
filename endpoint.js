const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Password check rules are defined in configuration.json
const rulesValidPassword = JSON.parse(fs.readFileSync("configuration.json", "utf8"));

// Start server
const server = app.listen(3000, "localhost", () => {
  const { address, port } = server.address();
  console.log(`Server is running at http://${address}:${port}`);
});

// Password Check API
app.post("/", (req, res) => {
  const password = req.body.password;
  const errorMsgs = validatePassword(password);

  if (errorMsgs.length > 0) {
    return res.status(400).json({ statusMessage: errorMsgs });
  }

  res.status(204).json({ statusMessage: "success" });
});

/**
 * Validate password against rules defined in configuration.json
 * @param {string} password - The password to validate
 * @returns {string[]} - List of error messages if any rules are violated
 */
function validatePassword(password) {
  const errorMsgs = [];

  for (const rule of rulesValidPassword) {
    const regex = new RegExp(rule.rex, "g");
    if (!password.match(regex)) {
      errorMsgs.push(rule.error);
    }
  }

  return errorMsgs;
}
