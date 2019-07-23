const users = [];

const addUser = ({ id, username, room}) => {
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // check for existing user
    const existingUser = users.find(user => {
        return user.username === username;
    })

    if (existingUser) {
        return {
            error: 'Username already taken!'
        }
    }

    //store user
    const user = { id, username, room };
    users.push(user);

    return { user };
}

const removeUser = (id) => {
    //using find ndex and then splice is faster
    const index = users.findIndex(user => {
        return user.id === id;
    })
    const user = users.splice(index, 1)

    return user[0];
}

const getUser = (id) => {
    const user = users.find(user => user.id === id);

    return user;
}

const getUsersInRoom = (room) => {
    const usersInRoom = users.filter(user => user.room === room);

    return usersInRoom;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}