const guessMessages = document.getElementById('guess-messages');
const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess-input');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

// let topic;
// socket.emit('topic', roomId)
// socket.on('topic', (topic1) => {
//     topic = topic1;
//     console.log(topic)
// });

async function login(){
    const response = await fetch('/getLogin');
    const res = await response.json();
    if (res.ok == true){
        user = res.user;

    // socket.on('topic', (topic) => {
    guessForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log(topic)
        if (guessInput.value){
            // socket.on('topic', (topic) => {
            if (guessInput.value == topic){
                socket.emit('win', roomId, user)
                // socket.emit('guess', '恭喜答對了！', roomId);
                guessInput.value = '';
            }else{
                socket.emit('guess', guessInput.value, roomId);
                guessInput.value = '';
            };
            // });
        };
    });

socket.on('guess', function(msg, userName) {
    const guessItem = document.createElement('li');
    guessItem.className = 'li'
    guessItem.textContent = userName + '猜' + msg;
    guessMessages.appendChild(guessItem);
    guessMessages.scrollTo(0, guessMessages.scrollHeight);
});

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (chatInput.value){
        socket.emit('chat', chatInput.value, roomId);
        chatInput.value = '';
    }
});

socket.on('chat', function(msg, userName) {
    const chatItem = document.createElement('li');
    chatItem.className = 'li'
    chatItem.textContent = userName +'：'+ msg;
    chatMessages.appendChild(chatItem);
    chatMessages.scrollTo(0, chatMessages.scrollHeight);
});

socket.on('connectToRoom',function(data) {
    const roomItem = document.createElement('li');
    roomItem.className = 'li'
    roomItem.textContent = data;
    chatMessages.appendChild(roomItem);
    chatMessages.scrollTo(0, chatMessages.scrollHeight);
});

socket.on('leaveRoom',function(data) {
    const roomItem = document.createElement('li');
    roomItem.className = 'li'
    roomItem.textContent = data;
    chatMessages.appendChild(roomItem);
    chatMessages.scrollTo(0, chatMessages.scrollHeight);
});

};
};
login();