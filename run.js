var request = require("request");
var mysql = require("mysql");

// todo: please update api urls
// password check api url
var checkApiURL = "http://localhost:3000/";
// password compromised check api url
var compriomiseApiURL = "http://localhost:5000/compromised?password=";

// database connection
// todo: please update database connection details here
var dbCon = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "testdb",
});

dbCon.connect(function (err) {
  if (err) throw err;

  // get passwords from database
  dbCon.query("SELECT * FROM `passwords`", function (err, rows) {
    if (err) throw err;

    let items = rows;
    let i = 0;

    new Promise(async (resolve, reject) => {
      try {
        if (items.length == 0) return resolve();

        let checkPwd = async () => {
          await checkPassword(rows[i].password);
          i++;
          if (i == items.length) resolve();
          else checkPwd();
        };

        checkPwd();
      } catch (e) {
        reject(e);
      }
    });
  });
});

/**
 * Password checking
 * @param {password} password
 */
async function checkPassword(password) {
  try {
    await isPasswordValid(password);
    await isPasswordCompromised(password);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Check if the password is valid or not
 * @param {password} password
 */
function isPasswordValid(password) {
  let promise = new Promise((resolve, reject) => {
    // call password check api
    let postData = { json: { password: password } };
    request.post(checkApiURL, postData, function (error, response, body) {
      if (error) throw error;

      let isValid = 0;
      console.log("------- \nPassword: %s", password);

      // success case
      if (response.statusCode == "204") {
        isValid = 1;
        console.log("Password is valid");
      }
      // error case
      else {
        let msg = "";
        if (body.statusMessage != null) msg = body.statusMessage.join("\n");
        else msg = body.statusMessage;
        console.log("Error Message(s):\n%s", msg);
      }

      // update validation status in database
      let updateQuery =
        "UPDATE `passwords` SET valid = '" +
        isValid +
        "' WHERE password = '" +
        password +
        "'";
      dbCon.query(updateQuery, function (error) {
        if (error) throw error;
      });

      resolve("password validation done");
    });
  });
  return promise;
}

/**
 * Check if the password is compromised or not
 * @param {password} password
 */
function isPasswordCompromised(password) {
  let promise = new Promise((resolve, reject) => {
    request.get(compriomiseApiURL + password, (error, response, body) => {
      if (error) throw error;

      if (response.statusCode == 200) {
        console.log("Password is compromised");
      } else if (response.statusCode == 204) {
        console.log("Password is not compromised");
      } else {
        console.log("Invalid Data");
      }
      resolve("password compromised checking done");
    });
  });
  return promise;
}
