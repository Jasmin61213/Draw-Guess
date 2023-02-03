const socket = io();

const guessMessages = document.getElementById('guess-messages');
const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess-input');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

//加入房間
const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
socket.emit('join-room', roomId);

let user;
//驗證登入者
async function login(){
    const response = await fetch('/getLogin');
    const res = await response.json();
    if (res.ok == true){
        user = res.user;

//遊戲流程
const startGame = document.querySelector('.start-button');
const waitTextHost = document.querySelector('.wait-text-host');
const waitText = document.querySelector('.wait-text');
const startBlock = document.querySelector('.start');
const look = document.querySelector('.look');

socket.emit('roomStatus', roomId);
socket.on('roomStatus', (roomInfo, roomMember, roomRound, thisRoomTopic) => {
    console.log(roomInfo, roomMember, roomRound, thisRoomTopic);
    if (roomInfo == 'waiting'){
        if (user == roomMember[0]){
        startGame.style.display = 'block';
        waitTextHost.style.display = 'block';
        waitText.style.display = 'none';
        };
    };
    if (roomInfo == 'playing'){
        topic = thisRoomTopic;
        startBlock.style.display = 'none';
        const img = document.querySelectorAll('.memberPic');
        for (let i =0; i<img.length; i++){
            img[i].src = '/image/pencillittle.png'
        }
        img[roomRound].src = '/image/pencilbrown.png';
        if (user == roomMember[roomRound]){
            look.style.display = 'none';
            const guessItem = document.createElement('li');
            guessItem.className = 'li';
            guessItem.textContent = '輪到你了！題目是' + topic;
            guessMessages.appendChild(guessItem);
            guessMessages.scrollTo(0, guessMessages.scrollHeight);
        }else{
            look.style.display = 'block';
        };
    };
});

let topic;
//房主按下按鈕開始遊戲，更改遊戲狀態
startGame.addEventListener('click', function(e) {
    socket.emit('beginGame', roomId);
    // let topic;
    // socket.emit('topic', roomId)
    // socket.on('topic', (thisRoomTopic) => {
    //     topic = thisRoomTopic;
    // });
});

socket.on('winScore', (roomScore, user) => {
    const score = document.getElementById(user);
    score.textContent = 'Score：' + roomScore;
    // topic = thisRoomTopic;
})

// socket.on('topic', function(msg) {
//     const guessItem = document.createElement('li');
//     guessItem.className = 'li'
//     guessItem.textContent = msg;
//     guessMessages.appendChild(guessItem);
//     guessMessages.scrollTo(0, guessMessages.scrollHeight);
// });

//接收開始遊戲訊息
// socket.on('beginGame',(roomInfo, roomMember, roomRound, topic) => {
//         startBlock.style.display = 'none';
//         const img = document.querySelectorAll('.memberPic');
//         img[roomRound].src = '/image/pencilbrown.png';
//         if (user == roomMember[roomRound]){
//             look.style.display = 'none';
//             const guessItem = document.createElement('li');
//             guessItem.className = 'li';
//             guessItem.textContent = '輪到你了！題目是' + topic;
//             guessMessages.appendChild(guessItem);
//             guessMessages.scrollTo(0, guessMessages.scrollHeight);
//         };
// });

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
            img.src = '/image/pencillittle.png';
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

//canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
//設定滑鼠座標(0,0)
let isDrawing = false; 
let lastX = 0;
let lastY = 0;
ctx.strokeStyle = "#65524D"; // 畫筆顏色
ctx.lineWidth = 4;
ctx.lineJoin = "round"; // 畫筆圓角
ctx.lineCap = "round"; // 畫筆圓角

//點按滑鼠更新座標
canvas.addEventListener('mousedown', function(obj){
    isDrawing = true;
    [lastX, lastY] = [obj.offsetX, obj.offsetY];
    // 按下滑鼠傳送座標
    socket.emit('beginDraw',
    {
        'x':obj.offsetX,
        'y':obj.offsetY
    }, roomId)
});

//移動滑鼠開始畫畫
canvas.addEventListener('mousemove', function(obj){
    if(!isDrawing){
        return
    };
    ctx.beginPath(); //路徑開始
    ctx.moveTo(lastX, lastY); //移動路徑
    ctx.lineTo(obj.offsetX, obj.offsetY); //畫出路徑
    ctx.stroke();
    // ctx.save();
    ctx.closePath();
    [lastX, lastY] = [obj.offsetX, obj.offsetY]; //更新座標
    // 傳送畫筆路徑
    socket.emit('draw',
    {
        'x':obj.offsetX,
        'y':obj.offsetY
    }, roomId)
});

//當滑鼠放開時，停止畫畫
canvas.addEventListener("mouseup", function(){
    isDrawing = false;
    socket.emit('endDraw', roomId)
});

//當滑鼠離開畫布時，停止畫畫
canvas.addEventListener("mouseout", function(){
    isDrawing = false;
    socket.emit('endDraw', roomId)
});

// 接收畫畫開始座標
socket.on('beginDraw', function(point){
	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
    [lastX, lastY] = [point.x, point.y];
});

// 接收畫筆路徑，並更新座標
socket.on('draw', function(point){
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    [lastX, lastY] = [point.x, point.y];
});

// 接收結束畫畫
socket.on('endDraw', function(){
	isDrawing = false;
	ctx.closePath();
});

guessForm.addEventListener('submit', function(e) {
    e.preventDefault();
    // console.log(topic)
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

socket.on('winMessage', (user) => {
    const guessItem = document.createElement('li');
    guessItem.className = 'li'
    guessItem.textContent = '恭喜' + user + '猜對了';
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