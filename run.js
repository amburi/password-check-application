var request = require('request');
var mysql = require('mysql');
var URL = "http://localhost:3000/";

// database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "testdb"
});

con.connect(function (err) {
    if (err) throw err;

    // get passwords from database
    con.query('SELECT * FROM passwords', function (err, rows) {
        if (err) throw err;

        if (rows.length > 0) {
            for (let row of rows) {
                let password = row.password;

                // call password check api
                request.post(URL, { json: { password: password } }, function (error, response, body) {

                    console.log("---------------------")
                    console.log("Password: " + password);

                    let validStatus = 0;
                    if (response.statusCode == '204') { // success case
                        validStatus = 1;
                        console.log("Password is valid");
                    } else { // for status code 400 // error case
                        console.log("Error Message(s): \n" + body.errors.join("\n"));
                    }

                    // update validation status in database
                    let updateQuery = "UPDATE passwords SET valid = '" + validStatus + "' WHERE password = '" + password + "'";
                    con.query(updateQuery, function (error) { if (error) throw error; });

                });

            }
        } else {
            console.log("No data found");
        }

    });
});



