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

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
    res.render('home');
});

mongo.connectToMongoDB()
    .then(() => {
        console.log('MongoDB ready - configuring application sockets...');

        io.use((socket, next) => {
            const username = socket.handshake.auth.username;
            if (!username || username.trim() === "" || username.trim().toLowerCase() === "system") {
                return next(new Error("Auth failed. Username is required to connect"));
            }
            socket.username = username.trim();
            next();
        });

        io.on('connection', async (socket) => {
            try {
                const db = mongo.getDb();
                await db.collection('messages').insertOne({ 
                    username: "System",
                    text: `${socket.username} has joined the chat.`
                });
                console.log('succeeded in adding message to database');
            } catch (e) {
                console.error('Failed to save to db:', e);
            }

            console.log(`${socket.username} connected`);
            io.emit('user login', `System: ${socket.username} joined the chat.`);

            try {
                const db = mongo.getDb();
                const messages = await db.collection('messages')
                            .find({}, { projection: { _id: 0 } })
                            .toArray();

                messages.forEach((msg) => {
                    socket.emit('chat message', msg);
                });
                
                console.log(`Loaded ${messages.length} historical messages.`);
            } catch (err) {
                console.error('Error loading messages from database:', err);
            }

            socket.on('chat message', async (msg) => {
                console.log(`message: ${msg}, user: ${socket.username}`);
                
                try {
                    const db = mongo.getDb();
                    await db.collection('messages').insertOne({ 
                        username: socket.username,
                        text: msg 
                    });
                    console.log('succeeded in adding message to database');
                } catch (e) {
                    console.error('Failed to save to db:', e);
                }
                console.log(socket.username + msg);
                io.emit('chat message', { username: socket.username, text: msg });
            });

            socket.on('disconnect', async () => {
                try {
                    const db = mongo.getDb();
                    await db.collection('messages').insertOne({ 
                        username: "System",
                        text: `${socket.username} has left the chat.`
                    });
                    console.log('succeeded in adding message to database');
                } catch (e) {
                    console.error('Failed to save to db:', e);
                }

                io.emit('user login', `System: ${socket.username} has left the chat.`)
                console.log('a user disconnected');
            });
        });

        server.listen(3000, () => {
            console.log('App running on port:3000');
        });
    })
    .catch((err) => {
        console.error('Critical database initialization failure. App closing.', err);
        process.exit(1); 
    });
