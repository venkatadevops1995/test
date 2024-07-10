"use strict";
const express = require("express");
const path = require('path');
const compression = require("compression");

const _port = 4202;
const _app_folder = 'templates';

const app = express();
app.use(compression());


// ---- SERVE STATIC FILES ---- //
app.get('*.*', express.static(_app_folder, {maxAge: '1y'}));

// ---- SERVE APLICATION PATHS ---- //
/*app.all('*', function (req, res) {
    res.status(200).sendFile(`/`, {root: _app_folder});
    //res.status(200).sendFile(`/`, {root: _app_folder+"/index.html"});
});
*/

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates/index.html'));
});

// ---- START UP THE NODE SERVER  ----
app.listen(_port, function () {
    console.log("Node Express server for " + app.name + " listening on http://localhost:" + _port);
});
