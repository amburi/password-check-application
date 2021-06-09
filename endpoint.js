var express = require('express');
const filesync = require('fs')
var parser = require('body-parser')
var exp = express();
exp.use(parser.json());
exp.use(parser.urlencoded({ extended: true }));

/**
 * Server
 */
var server = exp.listen("3000", "localhost", function () {
    let host = server.address().address
    let port = server.address().port
    console.log("Server is running at http://%s:%s", host, port);
});

/**
 * Password Check API
 */
 exp.post('/', function (req, res) {
    let errorMsgs = [];
    let password = req.body.password;

    // password check rules are defined at configuration.json
    var data = filesync.readFileSync('configuration.json', 'utf8');
    let regExs = JSON.parse(data);
    if(regExs.length > 0) {
        for (let r of regExs) {
            let regex = new RegExp(r.rex, 'g');
            if (!password.match(regex)) {
                errorMsgs.push(r.error);
            }
        }
    }
    
    if (errorMsgs.length > 0) { // error case
        res.status(400);
        res.json({ errors: errorMsgs });
    } else { // success case
        res.status(204);
        res.json({});
    }
});

