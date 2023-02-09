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
canvas.addEventListener('pointerdown', function(obj){
    isDrawing = true;
    [lastX, lastY] = [obj.offsetX, obj.offsetY];
    // 按下滑鼠傳送座標
    socket.emit('beginDraw',{
        'x':obj.offsetX,
        'y':obj.offsetY
    }, roomId)
});

//移動滑鼠開始畫畫
canvas.addEventListener('pointermove', (obj) => {
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
    socket.emit('draw',{
        'x':obj.offsetX,
        'y':obj.offsetY
    }, roomId)
});

//當滑鼠放開時，停止畫畫
canvas.addEventListener("pointerup", () => {
    isDrawing = false;
    socket.emit('endDraw', roomId)
});

//當滑鼠離開畫布時，停止畫畫
canvas.addEventListener("pointerout", () => {
    isDrawing = false;
    socket.emit('endDraw', roomId)
});

// 接收畫畫開始座標
socket.on('beginDraw', (point) => {
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    [lastX, lastY] = [point.x, point.y];
});

// 接收畫筆路徑，並更新座標
socket.on('draw', (point) => {
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    [lastX, lastY] = [point.x, point.y];
});

// 接收結束畫畫
socket.on('endDraw', () => {
    isDrawing = false;
    ctx.closePath();
});

socket.on('brushChanged', (color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
});

//清除畫布
function clearCanvas(){  
    canvas.height=canvas.height; 
    ctx.strokeStyle = "#65524D";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap = "round"; 
};

//畫筆顏色
let color;
let width;
const redPen = document.querySelector('.red');
const orangePen = document.querySelector('.orange');
const yellowPen = document.querySelector('.yellow');
const greenPen = document.querySelector('.green');
const bluePen = document.querySelector('.blue');
const purplePen = document.querySelector('.purple');
const pinkPen = document.querySelector('.pink');
const greyPen = document.querySelector('.grey');
const eraser = document.querySelector('.eraser');
const colorPens = [redPen,orangePen,yellowPen,greenPen,bluePen,purplePen,pinkPen,greyPen,eraser]

function colorSelected(colorPen){
    for (let i = 0; i < colorPens.length; i++){
        if (colorPens[i] == eraser){
            colorPens[i].style.border = '';
        }else{
            colorPens[i].style.border = '1.5px solid #dadada';
        };
        colorPens[i].style.width = '37px';
        colorPens[i].style.height = '37px';
    }
    if (colorPen == greyPen || colorPen == purplePen){
        colorPen.style.border = '3px dashed #d3a588';
    }else{
        colorPen.style.border = '3px dashed #65524D';
    };
    colorPen.style.width = '34px';
    colorPen.style.height = '34px';
};

redPen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#F2542D";
    width = 4;
    ctx.strokeStyle = "#F2542D";
    colorSelected(redPen)
    socket.emit('brushChanged', roomId, color, width);
});

orangePen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#fe7f2d";
    width = 4;
    ctx.strokeStyle = "#fe7f2d";
    colorSelected(orangePen)
    socket.emit('brushChanged', roomId, color, width);
});

yellowPen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#fcca46";
    width = 4;
    ctx.strokeStyle = "#fcca46";
    colorSelected(yellowPen)
    socket.emit('brushChanged', roomId, color, width); 
});

greenPen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#a1c181";
    width = 4;
    ctx.strokeStyle = "#a1c181";
    colorSelected(greenPen)
    socket.emit('brushChanged', roomId, color, width);
});

bluePen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#98c1d9";
    width = 4;
    ctx.strokeStyle = "#98c1d9";
    colorSelected(bluePen)
    socket.emit('brushChanged', roomId, color, width); 
});

purplePen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#886176";
    width = 4;
    ctx.strokeStyle = "#886176";
    colorSelected(purplePen)
    socket.emit('brushChanged', roomId, color, width);
});

pinkPen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#FCBFB7";
    width = 4;
    ctx.strokeStyle = "#FCBFB7";
    colorSelected(pinkPen)
    socket.emit('brushChanged', roomId, color, width);
});

greyPen.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#65524d";
    width = 4;
    ctx.strokeStyle = "#65524d";
    colorSelected(greyPen)
    socket.emit('brushChanged', roomId, color, width);
});

eraser.addEventListener('click', (e) => {
    e.preventDefault();
    color = "#fff";
    width = 30;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 30;
    colorSelected(eraser)
    socket.emit('brushChanged', roomId, color, width);
});