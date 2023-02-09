const socket = io();

//加入房間
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
socket.emit('join-room', roomId);

//驗證登入者
let user;
async function login(){
    const response = await fetch('/getLogin');
    const res = await response.json();
    if (res.ok == true){
        user = res.user;
        game();
    }else{

    }
};
login();

function game(){
    //遊戲流程
    const startGame = document.querySelector('.start-button');
    const waitTextHost = document.querySelector('.wait-text-host');
    const waitText = document.querySelector('.wait-text');
    const startBlock = document.querySelector('.start');
    const look = document.querySelector('.look');
    const topicDiv = document.querySelector('.topic');
    const time = document.querySelector('.bar');
    const penChanged = document.querySelector('.pen');
    let topic;
    let timerId;
    // let count;

    socket.emit('roomStatus', roomId);
    socket.on('roomStatus', (roomInfo, roomMember, roomRound, thisRoomTopic, roundChange) => {
        console.log(roomInfo, roomMember, roomRound, thisRoomTopic, roundChange);
        if (roomInfo == 'waiting'){
            penChanged.style.display = 'none';
            guessInput.setAttribute('disabled', 'disabled') 
            guessInput.style.cursor = 'not-allowed';
            if (user == roomMember[0]){
                clearInterval(timerId);
                let count = 100;
                time.style.width = count + '%';
                startBlock.style.display = 'block';
                // startGame.style.display = 'block';
                startGame.style.display = 'none';
                waitTextHost.style.display = 'block';
                waitText.style.display = 'none';
                if (roomMember.length != 1){
                    startGame.style.display = 'block';
                }
            };
        };
        if (roomInfo == 'playing'){
            if (roundChange){
                guessInput.value = '';
                clearCanvas();
            }
            topic = thisRoomTopic;
            startBlock.style.display = 'none';
            const img = document.querySelectorAll('.memberPic');
            for (let i =0; i<img.length; i++){
                img[i].src = '/image/pencillittle-r.png';
            }
            img[roomRound].src = '/image/pencilbrown.png';
            if (user == roomMember[roomRound]){
                penChanged.style.display = 'block';
                look.style.display = 'none';
                topicDiv.textContent = '題目：' + topic;
                topicDiv.style.display = 'block';
                guessInput.setAttribute('disabled', 'disabled'); 
                guessInput.style.cursor = 'not-allowed';
                if (roundChange){
                    socket.emit('nextDraw', roomId);
                    timerId = setInterval(timer, 10);
                };
                let count = 100;
                let min = 1/60;
                // let min = 0.1;
                function timer() {
                    count -= min;
                    if (count <= 0) {
                        socket.emit('nextRound', roomId);
                        socket.emit('lose', roomId);
                        clearInterval(timerId);
                        // count = 100;
                    }
                    socket.on('stopTime', () => {
                        clearInterval(timerId);
                        // count = 100;
                    });
                    time.style.width = count + '%';
                    socket.emit('getTime', roomId, count);
                };
            }else{
                penChanged.style.display = 'none';
                look.style.display = 'block';
                topicDiv.style.display = 'none';
                guessInput.removeAttribute('disabled', 'disabled');
                guessInput.style.cursor = 'auto';
                socket.on('getTime', (roomTime) => {
                    time.style.width = roomTime + '%';
                });
            };
        };
    });

    //房主按下按鈕開始遊戲，更改遊戲狀態
    startGame.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('click')
        socket.emit('beginGame', roomId);
        startGame.style.display = 'none';
    });

    // 遊戲勝利處理流程
    socket.on('winScore', (win, winUser, draw, drawUser) => {
        const winScore = document.getElementById(winUser);
        winScore.textContent = 'Score：' + win;
        const drawScore = document.getElementById(drawUser);
        drawScore.textContent = 'Score：' + draw;
        clearCanvas();
    });

    //成員列表
    const memberWrap = document.querySelector('.member')
    socket.on('member',(member) =>{
        socket.on('score', (score) => {
            const block = document.querySelectorAll(".memberBlock")
            for (i = 0; i<block.length; i++){
                block[i].remove();
            };
            for (let i=0; i<member.length; i++){
                const memberBlock = document.createElement('div');
                memberBlock.className = 'memberBlock';
                const left = document.createElement('div');
                left.className = 'left';
                const img = document.createElement('img');
                img.src = '/image/pencillittle-r.png';
                img.className = 'memberPic';
                const right = document.createElement('div');
                right.className = 'right';
                const memberName = document.createElement('div');
                memberName.className = 'memberName';
                memberName.textContent = member[i];
                const memberScore = document.createElement('div');
                memberScore.className = 'memberScore';
                memberScore.id = member[i];
                memberScore.textContent = 'Score：' + score[member[i]];
                left.appendChild(img)
                right.appendChild(memberName);
                right.appendChild(memberScore);
                memberBlock.appendChild(left);
                memberBlock.appendChild(right);
                memberWrap.appendChild(memberBlock);
            };
        });
    });

    // message
    const guessMessages = document.getElementById('guess-messages');
    const guessForm = document.getElementById('guess-form');
    const guessInput = document.getElementById('guess-input');

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    guessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (guessInput.value){
            socket.emit('guess', guessInput.value, roomId);
            if (guessInput.value == topic){
                async function win(){
                    const stopTimeSocket = await socket.emit('stopTime', roomId);
                    const winSocket = await socket.emit('win', roomId, user);
                }
                win();
            }else{
                guessInput.value = '';
            };
        };
    });

    socket.on('nextDraw', (userName) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = `這回合輪到${userName}！`;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('lose', () => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = '時間到！沒有人猜對';
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('guess', (msg, userName) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = userName + '猜：' + msg;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (chatInput.value){
            socket.emit('chat', chatInput.value, roomId);
            chatInput.value = '';
        };
    });

    socket.on('chat', (msg, userName) => {
        const chatItem = document.createElement('li');
        chatItem.className = 'li'
        chatItem.textContent = userName +'：'+ msg;
        chatMessages.appendChild(chatItem);
        chatMessages.scrollTo(0, chatMessages.scrollHeight);
    });

    socket.on('winMessage', (user) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = '恭喜' + user + '猜對了！';
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('connectToRoom', (data) => {
        const roomItem = document.createElement('li');
        roomItem.className = 'li'
        roomItem.textContent = data;
        chatMessages.appendChild(roomItem);
        chatMessages.scrollTo(0, chatMessages.scrollHeight);
    });

    socket.on('leaveRoom', (data) => {
        const roomItem = document.createElement('li');
        roomItem.className = 'li'
        roomItem.textContent = data;
        chatMessages.appendChild(roomItem);
        chatMessages.scrollTo(0, chatMessages.scrollHeight);
    });
};
