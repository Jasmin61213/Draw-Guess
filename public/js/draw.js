//socket
// const socket = io();

//canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
//設定滑鼠座標(0,0)
let isDrawing = false; 
let lastX = 0;
let lastY = 0;
ctx.strokeStyle = "#1A090D"; // 畫筆顏色
ctx.lineWidth = 4;
ctx.lineJoin = "round"; // 畫筆圓角
ctx.lineCap = "round"; //

//點按滑鼠更新座標
canvas.addEventListener('mousedown', function(obj){
    isDrawing = true;
    [lastX, lastY] = [obj.offsetX, obj.offsetY];
    // 按下滑鼠傳送座標
    socket.emit('beginDraw',
    {
        'x':obj.offsetX,
        'y':obj.offsetY
    })
});

//移動滑鼠開始畫畫
canvas.addEventListener('mousemove', function(obj){
    if(!isDrawing){
        return
    };
    ctx.beginPath();          //路徑開始
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
    })
});

//當滑鼠放開時，停止畫畫
canvas.addEventListener("mouseup", function(){
    isDrawing = false;
    socket.emit('endDraw')
});

//當滑鼠離開畫布時，停止畫畫
canvas.addEventListener("mouseout", function(){
    isDrawing = false;
    socket.emit('endDraw')
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