const socket = io();

//加入房間
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
// socket.emit('joinRoom', roomId);

//驗證登入者
let user;
async function login(){
    const response = await fetch('/api/auth/getLogin');
    const res = await response.json();
    if (res.ok == true){
        socket.emit('joinRoom', roomId);
        socket.emit('getTimer', roomId);
        user = res.user;
        game();
    }else{
        shareDiv.style.display = 'none';
        signDiv.style.display = 'block';
    };
};
if (document.readyState === "complete"){
    login();
}else{
    document.addEventListener("DOMContentLoaded", login);
};

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
    const restDiv = document.querySelector('.rest');
    const winnerDiv = document.querySelector('.win');
    const refresh = document.querySelector('.refresh');
    let topic;
    let getTimerId;
    let timerId;
    let restTimerId;
    const getTimerIds = {};
    const timerIds = {};
    const restTimerIds = {};

    socket.on('getTimer' , (count, restCount,roomStatus) => {
        // let count = 100;
        let getCount;
        let getMin;
        if (roomStatus == 'playing'){
            getCount = count;
            getMin = 1/64;
        };
        if (roomStatus == 'resting'){
            getCount = restCount;
            getMin = 1/8;
        };
        // let getMin = 1/64;
        // let getMin = 0.1;
        if (!getTimerIds[roomId]){
        getTimerId = setInterval(() =>{
            getCount -= getMin;
            if (getCount <= 0) {
                clearInterval(getTimerId);
                delete getTimerIds[roomId];
                // clearCanvas();
                // getCount = 100;
            };
            time.style.width = getCount + '%';
            }, 10);
        };
        getTimerIds[roomId] = getTimerId;
    });



    socket.on('roomMaxScore', (maxScore) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.textContent = `最先達到 ${ maxScore } 分者獲勝！`;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    // socket.emit('roomInfo', roomId);
    socket.on('roomInfo', (thisRoomInfo) => {
        console.log(thisRoomInfo);
        if (thisRoomInfo.roomStatus == 'waiting'){
            look.style.display = 'none';
            startBlock.style.display = 'block';
            topicDiv.style.display = 'none';
            waitText.style.display = 'block';
            penChanged.style.display = 'none';
            guessInput.setAttribute('disabled', 'disabled');
            guessInput.style.cursor = 'not-allowed';
            winnerDiv.style.display = 'none';
            if (user == thisRoomInfo.host){
                startGame.style.display = 'none';
                waitTextHost.style.display = 'block';
                waitText.style.display = 'none';
                if (thisRoomInfo.roomMember.length != 1){
                    startGame.style.display = 'block';
                };
            };
        };
        if (thisRoomInfo.roomStatus == 'playing'){
            // if (user == thisRoomInfo.host){
            //     socket.emit('startTimer', roomId);
            // };  
            look.style.display = 'block';
            restDiv.style.display = 'none';
            guessInput.value = '';
            topic = thisRoomInfo.topic;
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
            img[thisRoomInfo.roomDraw].src = '/image/pencillittle-r.png';
            block[thisRoomInfo.roomDraw].style.backgroundColor = '#9C7C6B';
            memberName[thisRoomInfo.roomDraw].style.color = '#fff';
            memberScore[thisRoomInfo.roomDraw].style.color = '#fff';
            if (user == thisRoomInfo.drawer){
                chatInput.setAttribute('disabled', 'disabled');
                penChanged.style.display = 'block';
                look.style.display = 'none';
                topicDiv.textContent = '題目：' + topic;
                topicDiv.style.display = 'block';
                guessInput.setAttribute('disabled', 'disabled'); 
                guessInput.style.cursor = 'not-allowed';
                // socket.on('timer', (roomTime) => {
                //     time.style.width = roomTime + '%';
                // });
            }else{
                chatInput.removeAttribute('disabled', 'disabled');
                penChanged.style.display = 'none';
                topicDiv.style.display = 'none';
                guessInput.removeAttribute('disabled', 'disabled');
                guessInput.style.cursor = 'auto';
                // socket.on('timer', (roomTime) => {
                //     time.style.width = roomTime + '%';
                // });
            };
        };
        if (thisRoomInfo.roomStatus == 'resting'){
            // if (user == thisRoomInfo.host){
            //     socket.emit('startRestTimer', roomId);
            // };
            clearCanvas();
            chatInput.removeAttribute('disabled', 'disabled');
            restDiv.style.display = 'block';
            guessInput.value = '';
            penChanged.style.display = 'none';
            look.style.display = 'block';
            topicDiv.textContent = '中場休息';
            topicDiv.style.display = 'block';
            guessInput.setAttribute('disabled', 'disabled'); 
            guessInput.style.cursor = 'not-allowed';
            // let restCount = 100;
            // let restMin = 1/8;
            // if (!restTimerIds[roomId]){
            //     restTimerId = setInterval(() =>{
            //     restCount -= restMin;
            //     if (restCount <= 0) {
            //         clearInterval(restTimerId);
            //         delete restTimerIds[roomId];
            //         clearCanvas();
            //         restCount = 100;
            //         };
            //     time.style.width = restCount + '%';
            //     }, 10);
            // };
            // socket.on('stopRestTimer', () => {
            //     clearInterval(restTimerIds[roomId]);
            //     delete restTimerIds[roomId];
            //     clearCanvas();
            //     restCount = 100;
            // });
            // restTimerIds[roomId] = restTimerId;
        };
        if (thisRoomInfo.roomStatus == 'ending'){
            clearCanvas();
            guessInput.value = '';
            penChanged.style.display = 'none';
            winnerDiv.style.display = 'block';
            look.style.display = 'block';
            topicDiv.style.display = 'none';
            guessInput.setAttribute('disabled', 'disabled'); 
            guessInput.style.cursor = 'not-allowed';
            time.style.width = '100%';
            if (user == thisRoomInfo.host){
                refresh.style.display = 'block';
            };
        };
    });

    //計時器
    socket.on('startTimer', (roomStatus, host) => {   
        if (roomStatus == 'playing'){
            console.log('timer')
            if (user == host){
                console.log('host')
                socket.emit('startTimer', roomId);
            };
            let count = 100;
            let min = 1/64;
            // let min = 0.1;
            if (!timerIds[roomId]){
                timerId = setInterval(() =>{
                count -= min;
                // if (count <= 0) {
                //     clearInterval(timerIds[roomId]);
                //     delete timerIds[roomId];
                //     clearCanvas();
                //     count = 100;
                // };
                time.style.width = count + '%';
                }, 10);
            };
            timerIds[roomId] = timerId;
            // socket.on('stopTimer', () => {
            //     clearInterval(timerIds[roomId]);
            //     delete timerIds[roomId];
            //     clearCanvas();
            //     // count = 100;
            // });
        };
        
        if (roomStatus == 'resting'){
            if (user == host){
                socket.emit('startRestTimer', roomId);
            };
            let restCount = 100;
            let restMin = 1/8;
            if (!restTimerIds[roomId]){
                restTimerId = setInterval(() =>{
                restCount -= restMin;
                // if (restCount <= 0) {
                //     clearInterval(restTimerIds[roomId]);
                //     delete restTimerIds[roomId];
                //     clearCanvas();
                //     restCount = 100;
                //     };
                time.style.width = restCount + '%';
                }, 10);
            };
            restTimerIds[roomId] = restTimerId;
            // socket.on('stopRestTimer', () => {
            //     clearInterval(restTimerIds[roomId]);
            //     delete restTimerIds[roomId];
            //     clearCanvas();
            //     restCount = 100;
            // });
        };
    });

    socket.on('stopTimer', () => {
        clearInterval(timerIds[roomId]);
        delete timerIds[roomId];
        clearCanvas();
        // count = 100;
    });

    socket.on('stopRestTimer', () => {
        clearInterval(restTimerIds[roomId]);
        delete restTimerIds[roomId];
        clearCanvas();
        // restCount = 100;
    });

    const winTitle = document.querySelector('.win-title');
    socket.on('winnerDraw', (winner) => {
        winTitle.textContent = '恭喜！贏家是' + winner; 
    });
    socket.on('winnerUser', (winner) => {
        winTitle.textContent = '恭喜！贏家是' + winner; 
    });
    refresh.addEventListener('click', () => {
        socket.emit('refresh', roomId);
    });

    //房主按下按鈕開始遊戲，更改遊戲狀態
    startGame.addEventListener('click', (e) => {
        e.preventDefault();
        socket.emit('beginGame', roomId);
        startGame.style.display = 'none';
    });

    // 遊戲勝利處理流程
    socket.on('winScore', (win, winUser, draw, drawUser) => {
        const winScore = document.getElementById(winUser);
        winScore.textContent = 'Score：' + win;
        const drawScore = document.getElementById(drawUser);
        drawScore.textContent = 'Score：' + draw;
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
            // if (user == member[0]){
            //     if (member.length != 1){
            //         startGame.style.display = 'block';
            //     };
            // };
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
            if (guessInput.value == topic){
                guessInput.setAttribute('disabled', 'disabled');
                chatInput.setAttribute('disabled', 'disabled');
                socket.emit('guess', `${user}猜對了！`, roomId, true);
                socket.emit('win', roomId, user);
                // socket.emit('stopTimer', roomId);
            }else{
                socket.emit('guess', `${user}猜：${guessInput.value}`, roomId, false);
            };
            guessInput.value = '';
        };
    });

    socket.on('nextDrawer', (drawer) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li';
        guessItem.textContent = `下回合輪到${drawer}`;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('drawer', (drawer) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li';
        if (user == drawer){
            guessItem.textContent = `這回合輪到你了！`;
        }else{
            guessItem.textContent = `這回合輪到${drawer}了！`;
        };
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('lose', (topic) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.style.color = '#F2542D';
        guessItem.textContent = '時間到！答案是' + topic;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('guess', (msg, win) => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        if (win){
            guessItem.style.color = '#F2542D';
        };
        guessItem.textContent = msg;
        guessMessages.appendChild(guessItem);
        guessMessages.scrollTo(0, guessMessages.scrollHeight);
    });

    socket.on('everyoneCorrected', () => {
        const guessItem = document.createElement('li');
        guessItem.className = 'li'
        guessItem.style.color = '#F2542D';
        guessItem.textContent = '大家都猜對了！';
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

const signRemind = document.querySelector('.sign-remind');
const signRemindText = document.querySelector('.sign-remind-text');
const signRemindButton = document.querySelector('.sign-remind-button');

signRemindButton.addEventListener('click', (e) => {
    e.preventDefault();
    signRemind.style.display = 'none';
});
//登入帳號
function signIn(){
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    data = {
        'email':email,
        'password':password
    };
    fetch('/api/auth/login',{
        method: 'POST',
        body: JSON.stringify(data),
        cache: "no-cache",
        headers:{
            "Accept" : "application/json",
            "Content-Type" : "application/json"
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        if (res.ok == true){
            location.reload();
        };
        if (res.error == true){
            signRemind.style.display = 'block';
            signRemindText.textContent = res.message;
        };
    });
};

function signUp(){
    let user = document.getElementById('username').value;
    let email = document.getElementById('signup-email').value;
    let password = document.getElementById('signup-password').value;
    data = {
        'name':user,
        'email':email,
        'password':password
    };
    fetch('/api/auth/signup',{
        method: 'POST',
        body: JSON.stringify(data),
        cache: "no-cache",
        headers:{
            "Accept" : "application/json",
            "Content-Type" : "application/json"
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        if (res.ok == true){
            signInButton.style.backgroundColor = '#d3a588';
            signUpButton.style.backgroundColor = '#ECE2D0';
            signInDiv.style.display = 'flex';
            signDiv.style.height = '225px';
            signUpDiv.style.display = 'none';
        };
        if (res.error == true){
            signRemind.style.display = 'block';
            signRemindText.textContent = res.message;
        };
    });
};

const signDiv = document.querySelector('.nav');
const signInButton = document.querySelector('.sign-in-title');
const signUpButton = document.querySelector('.sign-up-title');
const signInDiv = document.querySelector('.sign-in-input-div');
const signUpDiv = document.querySelector('.sign-up-input-div');

signInButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInButton.style.backgroundColor = '#d3a588';
    signUpButton.style.backgroundColor = '#ECE2D0';
    signInDiv.style.display = 'flex';
    signDiv.style.height = '225px';
    signUpDiv.style.display = 'none';
});

signUpButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInButton.style.backgroundColor = '#ECE2D0';
    signUpButton.style.backgroundColor = '#d3a588';
    signInDiv.style.display = 'none';
    signUpDiv.style.display = 'flex';
    signDiv.style.height = '275px';
});