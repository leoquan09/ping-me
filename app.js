const express = require('express');
const { createServer } = require('node:http');
const path = require('node:path')
const { Server } = require('socket.io');

const app = express()
const server = createServer(app)
const io = new Server(server)

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views")); 

app.get('/', (req, res) => {
    res.render('home')
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log(`message: ${msg}`);
        io.emit('chat message', msg);
    });
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
});

server.listen(3000, () => {
    console.log("app running on port:3000");
});
