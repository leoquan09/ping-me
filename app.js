const express = require('express');
const { createServer } = require('node:http');
const path = require('node:path')
const socket

const app = express()
const server = createServer(app)

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views")); 

app.get('/', (req, res) => {
    res.render('home')
});

app.listen(3000, () => {
    console.log("app running on port:3000");
});