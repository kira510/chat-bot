const socket = io();
const $form = document.querySelector('#message-form');
const $messageInput = $form.querySelector('input');
const $btn = $form.querySelector('button');
const $locationBtn = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

/*
location is property on the window object that has access to the url
Get the query params and ignore the ? in that
*/
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    debugger
    //new message element
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages Container
    const containerHeight = $messages.scrollHeight;

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (location) => {
    console.log(location);
    const html = Mustache.render(locationTemplate,
        {
            username: location.username,
            location: location.url,
            createdAt: moment(location.createdAt).format('h:mm a')
        }
    );
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

function sendMessage () {
    event.preventDefault();
    $btn.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', $messageInput.value, (error) => {
        $messageInput.value = '';
        $messageInput.focus();
        $btn.removeAttribute('disabled');

        if (error) {
            console.log(error);
        }
    });
}

$locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationBtn.removeAttribute('disabled');
            console.log('Location Shared!');
        });
    }, (error) => { console.log(error)}, {timeout: 10000});
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/index.html';
    }
});

socket.on('roomData', ({room, roomUsers}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        roomUsers
    });

    document.querySelector('#sidebar').innerHTML = html;
})