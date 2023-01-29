let user;

//驗證登入者
fetch('/getLogin')
.then(function(response){
    return response.json()
})
.then(function(res){
    if (res.ok == true){
        user = res.user;
    };

});
// console.log(user)

//socket
const socket = io();

const params = new URLSearchParams(window.location.search);
const roomId = params.get('room');
socket.emit('join-room', roomId);
// socket.emit('roomInfo')
// socket.on('roomInfo', (roomInfo) => {
//     socket.emit('roomInfo', roomInfo)
// });
// socket.on('allRoomInfo', (roomId, allRoomInfo) => {
    
// });

//跳出框
// function remind(){

// }

//題目
const topic = ['烏龜','貓','狗','兔子']

//開始遊戲
const startGame = document.querySelector('.start-button')
const startBlock = document.querySelector('.start')
startGame.addEventListener('click', function(e) {
    startBlock.style.display = 'none'
    socket.on('beginGame',() => {

    })
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
            const memberName = document.createElement('div');
            memberName.className = 'memberName'
            memberName.textContent = member[i]
            const memberScore = document.createElement('div');
            memberScore.className = 'memberScore'
            memberScore.textContent = 'Score：' + score[member[i]]
            memberBlock.appendChild(memberName)
            memberBlock.appendChild(memberScore)
            memberWrap.appendChild(memberBlock)
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