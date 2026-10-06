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
    .then(() => {
        console.log('MongoDB ready - configuring application sockets...');

        io.on('connection', (socket) => {
            console.log('a user connected');

            socket.on('chat message', async (msg) => {
                console.log(`message: ${msg}`);
                
                try {
                    const db = mongo.getDb();
                    await db.collection('messages').insertOne({ text: msg });
                    console.log('succeeded in adding message to database');
                } catch (e) {
                    console.error('Failed to save to db:', e);
                }
                
                io.emit('chat message', msg);
            });

            socket.on('disconnect', () => {
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

function handleShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    
    server.close(async () => {
        console.log("HTTP server closed.");
        try {
            await mongo.disconnectFromMongoDB();
            console.log("Cleanup complete. Goodbye!");
            process.exit(0);
        } catch (err) {
            console.error("Error closing MongoDB cleanly:", err);
            process.exit(1);
        }
    });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
