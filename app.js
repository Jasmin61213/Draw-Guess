const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session')

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60 // default session expiration is set to 1 hour
    }
});

const { Server } = require("socket.io");
const { createDiffieHellmanGroup } = require('crypto');
const io = new Server(server);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));
app.use(sessionMiddleware);

app.get('/', (req, res) => {
    res.render('index')
});

app.get('/lobby', (req, res) => {
    res.render('lobby')
});

app.get('/draw', (req, res) => {
    res.render('draw')
});

app.post('/login',urlencodedParser,async(req, res) => {
    const user = req.body.name;
    req.session.user = user;
    res.status(200).json({'ok':true})
});

app.get('/getLogin',async(req, res) => {
    const user = req.session.user
    // console.log(user)
    res.status(200).json({
        'ok':true,
        'user':user
    })
});

app.get('/create-room', (req, res) => {
    const roomId = Date.now();
    res.status(200).json({'roomId':roomId})
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// const players = [];
// const allRoomInfo = [];
// const allRoomId = [];
const roomInfo = {};
const roomMember = {};
const roomScore = {};
// const allRoomInfo = [{
//     'id':'roomId',
//     'info':{
//         'playersName':'players'
//     }
// }];

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //房間
    socket.on('join-room', (roomId) =>{
        socket.join(roomId);
        if (!roomMember[roomId]){
            roomMember[roomId] = [];
        };
        if(!roomMember[roomId].includes(userName)){
            roomMember[roomId].push(userName);
        };
        roomScore[userName] = 0
        roomInfo[roomId] = userName
        // allRoomInfo.push(roomInfo[roomId]) 
        // allRoomId.push(roomId)
        // const thisRoomInfo = {
        //     'id': roomId,
        //     'roomOwner': userName
        // };
        // if (allRoomInfo.length == []){
        //     allRoomInfo.push(thisRoomInfo);
        // }else{
        //     if (!allRoomInfo.includes(thisRoomInfo)){
        //         allRoomInfo.push(thisRoomInfo);
        //     }
            // for (let i=0; i<allRoomInfo.length; i++){
            //     console.log(allRoomInfo.includes(thisRoomInfo))

            //     // if (allRoomInfo[i].id != roomId){
            //     //     noThisRoom = true
            //     // }
            //     // if(noThisRoom){
            //     //      allRoomInfo.push(thisRoomInfo);
            //     // }
            // }
        // }
        io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
        io.to(roomId).emit('member', roomMember[roomId]);
        io.to(roomId).emit('score', roomScore);
        // io.emit('lobby', allRoomId, allRoomInfo);
        io.emit('lobby', roomId, roomInfo, roomMember[roomId]);
    });

    socket.on("disconnect", () => {
        if (roomMember[leaveRoomId] != undefined){
            const index = roomMember[leaveRoomId].indexOf(userName);
            if (index !== -1) {
            roomMember[leaveRoomId].splice(index, 1);
            };
        };
        // if (roomMember[leaveRoomId].length == 0){

        // }
        // console.log(roomMember[leaveRoomId])
        // if (roomMember[leaveRoomId].length == []){
            //     io.emit('deleteRoom', leaveRoomId);
            // }
        // if (roomInfo[leaveRoomId] != undefined){
        //     const index = roomInfo[leaveRoomId].indexOf(userName);
        //     if (index !== -1) {
        //     roomInfo[leaveRoomId].splice(index, 1);
        //     };
        // };
        // if (allRoomInfo !== []){
            // if (allRoomInfo != undefined){
            //     for (let i=0;i<allRoomInfo.length;i++){
            //         if (allRoomInfo[i].roomOwner != undefined){
            //             if (allRoomInfo[i].roomOwner == userName){
            //                 delete allRoomInfo[i];
            //             };
            //         };
            //     };
            // }
        // };
        socket.leave(leaveRoomId); 
        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
        io.to(leaveRoomId).emit('member', roomMember[leaveRoomId]);
        io.to(leaveRoomId).emit('score', roomScore);
        // io.emit('lobby', leaveRoomId, allRoomInfo);
    });

    // socket.on('getScore',(roomId) => {
    //     console.log(roomMember[roomId][0])
    // })

    // socket.on('create-room', () => {
    //     const roomId = Date.now();
    //     const roomMember = {
    //             'id': roomId,
    //             'roomOwner': userName
    //         };
    //     allRoomInfo.push(roomMember);
    //     io.emit('create-room', roomId);
    //     io.emit('roomMember', allRoomInfo);
    // });

    // socket.on('join-room', (roomId) => {
    //     socket.join(roomId);
    //     if (!roomMember[roomId]){
    //         roomMember[roomId] = [];
    //     };
    //     if(!roomMember[roomId].includes(userName)){
    //         roomMember[roomId].push(userName);
    //     };
    //     const roomMember = {
    //         'id': roomId,
    //         'roomOwner': userName,
    //         roomId:[]
    //     };
    //     allRoomInfo.push(thisRoomInfo);
    //     io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
    //     io.to(roomId).emit('member', roomMember[roomId]);
    //     io.emit('roomMember', allRoomInfo);
    // });

    // socket.on("disconnect", () => {
    //     console.log(roomMember[leaveRoomId])
    //     // delete roomMember[leaveRoomId];
    //     // const index = roomMember[leaveRoomId].indexOf(userName);
    //     // if (index !== -1) {
    //     //   roomMember[leaveRoomId].splice(index, 1);
    //     // }
    //     socket.leave(leaveRoomId); 
    //     io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
    //     // console.log(leaveRoomId)
    //     // roomMember = {
    //     //     'roomId': leaveRoomId,
    //     //     'players': players
    //     // };
    //     // allRoomInfo.push(roomMember);
    //     // io.sockets.emit('roomMember', allRoomInfo);
    // });

    //聊天室
    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    //畫畫
    socket.on('beginDraw', function(point, roomId){
        socket.broadcast.to(roomId).emit('beginDraw', point);
    });

    socket.on('draw', function(point, roomId) {
        socket.broadcast.to(roomId).emit('draw', point);
     });

    socket.on('endDraw', function(roomId) {
        socket.broadcast.to(roomId).emit('endDraw');
    });
  });

// io.of('/lobby').on('connection', (socket) => {

// })

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
