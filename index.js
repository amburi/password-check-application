const request = require("request");
const mysql = require("mysql");

// API URLs
const checkApiURL = "http://localhost:3000/";
const compromiseApiURL = "http://localhost:8080/compromised?password=";

// Database connection
const dbCon = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "passwordDb",
});

dbCon.connect((err) => {
  if (err) throw err;
  fetchPasswords();
});

async function fetchPasswords() {
  try {
    const rows = await queryDb("SELECT * FROM `passwords`");
    await processPasswords(rows);
  } catch (error) {
    console.error("Error fetching passwords:", error);
  }
}

function queryDb(query, params = []) {
  return new Promise((resolve, reject) => {
    dbCon.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function processPasswords(passwords) {
  for (let passwordObj of passwords) {
    await checkPassword(passwordObj.password);
  }
}

async function checkPassword(password) {
  try {
    await isPasswordValid(password);
    await isPasswordCompromised(password);
  } catch (error) {
    console.error(`Error checking password '${password}':`, error);
  }
}

async function isPasswordValid(password) {
  const postData = { json: { password } };

  return new Promise((resolve, reject) => {
    request.post(checkApiURL, postData, async (error, response, body) => {
      if (error) return reject(error);

      let isValid = 0;
      if (response.statusCode === 204) {
        isValid = 1;
        console.log("Password is valid");
      } else {
        const msg = body.statusMessage ? body.statusMessage.join("\n") : "Unknown error";
        console.log(`Password validation error: ${msg}`);
      }

      try {
        await queryDb("UPDATE `passwords` SET valid = ? WHERE password = ?", [isValid, password]);
        resolve();
      } catch (dbError) {
        reject(dbError);
      }
    });
  });
}

async function isPasswordCompromised(password) {
  return new Promise((resolve, reject) => {
    request.get(compromiseApiURL + password, (error, response, body) => {
      if (error) return reject(error);

      if (response.statusCode === 200) {
        console.log("Password is compromised");
      } else if (response.statusCode === 204) {
        console.log("Password is not compromised");
      } else {
        console.log("Invalid response from compromised check");
      }

      resolve();
    });
  });
}
