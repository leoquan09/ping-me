const express = require('express');
const { createServer } = require('node:http');
const path = require('node:path');
const { Server } = require('socket.io');
const mongo = require('./config/mongoConfig.js');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views')); 

app.get('/', (req, res) => {
    res.render('home');
});

mongo.connectToMongoDB()
    .then(() => console.log('mongo connected'))
    .catch(() => console.log('failed to connect to mongo'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', async (msg) => {
        console.log(`message: ${msg}`);
        
        try {
            const db = mongo.client.db('chatApp');
            await db.collection('messages').insertOne({ text: msg });
            console.log('succeeded in adding message to database');
        } catch (e) {
            console.log('Failed to save to db:', e);
        }
        
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
});

server.listen(3000, () => {
    console.log('app running on port:3000');
});
