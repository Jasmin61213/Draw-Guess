const socket = io();

//加入房間
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
socket.emit('joinRoom', roomId);

//驗證登入者
let user;
async function login(){
    const response = await fetch('/api/auth/getLogin');
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

    socket.emit('roomStatus', roomId);
    socket.on('roomStatus', (roomInfo, roomMember, roomRound, thisRoomTopic, roundChange) => {
        // console.log(roomInfo, roomMember, roomRound, roundChange);
        if (roomInfo == 'waiting'){
            topicDiv.style.display = 'none';
            waitText.style.display = 'block';
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
            look.style.display = 'block';
            if (roundChange){
                guessInput.value = '';
                clearCanvas();
            };
            topic = thisRoomTopic;
            startBlock.style.display = 'none';
            const img = document.querySelectorAll('.memberPic');
            const block = document.querySelectorAll(".memberBlock");
            const memberName = document.querySelectorAll(".memberName");
            const memberScore = document.querySelectorAll(".memberScore");
            for (let i =0; i<img.length; i++){
                img[i].src = '/image/paws.png';
                block[i].style.backgroundColor = '#ECE2D0';
                memberName[i].style.color = '#65524D';
                memberScore[i].style.color = '#65524D';
            };
            img[roomRound].src = '/image/pencillittle-r.png';
            block[roomRound].style.backgroundColor = '#9C7C6B';
            memberName[roomRound].style.color = '#fff';
            memberScore[roomRound].style.color = '#fff';
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
                let min = 1/90;
                // let min = 0.1;
                function timer() {
                    count -= min;
                    if (count <= 0) {
                        look.style.display = 'block';
                        socket.emit('nextRound', roomId);
                        socket.emit('lose', roomId, topic);
                        clearInterval(timerId);
                        clearCanvas();
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
                // clearInterval(timerId);
                penChanged.style.display = 'none';
                // look.style.display = 'block';
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
            const block = document.querySelectorAll(".memberBlock");
            for (i = 0; i<block.length; i++){
                block[i].remove();
            };
            for (let i=0; i<member.length; i++){
                const memberBlock = document.createElement('div');
                memberBlock.className = 'memberBlock';
                const left = document.createElement('div');
                left.className = 'left';
                const img = document.createElement('img');
                img.src = '/image/paws.png';
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
                    socket.emit('stopTime', roomId);
                    socket.emit('win', roomId, user);
            }else{
                guessInput.value = '';
            };
        };
    });

    socket.on('nextDraw', (userName) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = `這回合輪到${userName}`;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('lose', (topic) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = '時間到！答案是' + topic;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('guess', (msg, userName) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = `${userName}猜：${msg}`;
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
        chatItem.textContent = `${userName}：${msg}`;
        chatMessages.appendChild(chatItem);
        chatMessages.scrollTo(0, chatMessages.scrollHeight);
    });

    socket.on('winMessage', (user) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = `恭喜${user}猜對了！`;
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

//複製房間連結
const shareDiv = document.querySelector('.share');
const share = document.querySelector('.share-input');
share.value = window.location.href;

document.querySelector('.share-close').addEventListener('click', () => {
    shareDiv.style.display = 'none';
});

document.querySelector('.share-img').addEventListener('click', () => {
    shareDiv.style.display = 'block';
});

document.querySelector('.share-button').addEventListener('click', () => {
    navigator.clipboard.writeText(share.value);
    document.querySelector('.success').style.display = 'block';
});

//離開房間
const leaveRoomButton = document.querySelector('.close');
const remind = document.querySelector('.remind');
const yes = document.querySelector('.yes');
const no = document.querySelector('.no');

leaveRoomButton.addEventListener('click', () => {
    remind.style.display = 'block';
});

yes.addEventListener('click' ,() => {
    window.location.href ='/lobby';
});

no.addEventListener('click' ,() => {
    remind.style.display = "none";
});