//socket
const socket = io();

const roomStatus = {
    'players':[],
    // 'room':roomID,
    'answer':0
}

const topic = ['烏龜','貓','狗','兔子']

const answer = topic[roomStatus.answer]

socket.on('connectToRoom',function(data) {
    const roomItem = document.createElement('li');
    roomItem.className = 'li'
    roomItem.textContent = data;
    chatMessages.appendChild(roomItem);
    chatMessages.scrollTo(0, chatMessages.scrollHeight);
});

// socket.on('leaveRoom',function(data) {
//     const roomItem = document.createElement('li');
//     roomItem.className = 'li'
//     roomItem.textContent = data;
//     chatMessages.appendChild(roomItem);
//     chatMessages.scrollTo(0, chatMessages.scrollHeight);
// });

const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
socket.on('connect', function(){
    if (roomId) {
        socket.emit('join-room', roomId);
    } else {
        socket.emit('create-room');
    }
});
socket.on('join-room-message', (message) => {
    console.log(message);
});
socket.on('room-brocast', (message) => {
    console.log(message);
});