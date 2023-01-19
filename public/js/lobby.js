const socket = io();

const newRoom = document.querySelector('.button')

newRoom.addEventListener('click', function(e) {
    e.preventDefault();
    socket.emit('create-room');
    socket.on('create-room', (roomId) => {
        window.location.href = '/draw?room='+roomId;
    });
});



