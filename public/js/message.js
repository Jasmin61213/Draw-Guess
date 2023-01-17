const guessMessages = document.getElementById('guess-messages');
const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess-input');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

guessForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (guessInput.value){
        socket.emit('guess', guessInput.value);
        guessInput.value = '';
    }
});

socket.on('guess', function(msg) {
    const guessItem = document.createElement('li');
    guessItem.className = 'li'
    guessItem.textContent = msg;
    guessMessages.appendChild(guessItem);
    guessMessages.scrollTo(0, guessMessages.scrollHeight);
});

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (chatInput.value){
        socket.emit('chat', chatInput.value);
        chatInput.value = '';
    }
});

socket.on('chat', function(msg) {
    const chatItem = document.createElement('li');
    chatItem.className = 'li'
    chatItem.textContent = msg;
    chatMessages.appendChild(chatItem);
    chatMessages.scrollTo(0, chatMessages.scrollHeight);
});