const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/util');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "..", "public");

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('socket io connected!');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({
            id: socket.id,
            username,
            room
        });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Welcome to Chat App!', 'CHATBOT:'));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`, 'CHATBOT:'));
        io.to(user.room).emit('roomData', {
            room: user.room,
            roomUsers: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter(message);

        if (filter.isProfane(message)) {
            return callback('Profanity not allowed!');
        }

        const user = getUser(socket.id);

        if (!user) {
            return callback('Something went wrong!');
        }

        io.to(user.room).emit('message', generateMessage(message, user.username));
        callback('Delivered!')
    });

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id);

        if (!user) {
            return callback('Something went wrong!');
        }

        io.to(user.room).emit('locationMessage',
            generateLocationMessage(
                user.username,
                `https://google.com/maps?g=${position.latitude},${position.longitude}`
            )
        );
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage(
                `${user.username} left the room!`,
                'CHATBOT:')
            );

            io.to(user.room).emit('roomData', {
                room: user.room,
                roomUsers: getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, function () {
    console.log(`Server is up on port ${port}`);
});