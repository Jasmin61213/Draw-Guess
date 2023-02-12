const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const authRoute = require("./routes/auth");
// const {pool} = require('./model');

// require('dotenv').config();
// const bodyParser = require('body-parser');
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

const session = require('express-session');

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60
    }
});

const { Server } = require("socket.io");
const io = new Server(server);

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('public'));
app.use(sessionMiddleware);

app.use('/api/auth', authRoute)

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/lobby', (req, res) => {
    res.render('lobby');
});

app.get('/draw', (req, res) => {
    res.render('draw');
});

app.get('/create-room', (req, res) => {
    const roomId = Date.now();
    res.status(200).json({'roomId':roomId});
});

//socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const roomInfo = {};
const roomMember = {};
const roomScore = {};
const roomRound = {};
const roomDraw = {};
const roundChange = {};
const topic = {};
const topicIndex = {};
const topics = [
    '向日葵','蘋果','青蛙','光頭','西瓜','獅子','耳朵','皮卡丘','立可帶','警車',
    '腳踏車','鋼琴','火車','棉花糖','漢堡','翻車魚','望遠鏡','相機','螞蟻','牛',
    '海馬','耳機','手機','珍珠奶茶','時鐘','手錶','薯條','馬鈴薯','番茄','菠菜',
    '大象','黑板','電風扇','國旗','口罩','枕頭','棉被','滅火器','警察','鴕鳥',
    '企鵝','老鷹','熊貓','穿山甲','袋鼠','洗衣機','電視','太陽','拉麵','火鍋',
];
const topicsLength = topics.length;

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //房間
    socket.on('getRoom',() => {
        io.emit('lobby', roomInfo, roomMember);
    });

    socket.on('roomStatus', (roomId) => {
        roundChange[roomId] = false;
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomDraw[roomId], topic[roomId], roundChange[roomId]);
    })

    socket.on('join-room', (roomId) => {
        roundChange[roomId] = false;
        socket.join(roomId);
        if (!roomMember[roomId]){
            roomMember[roomId] = [];
        };
        if(!roomMember[roomId].includes(userName)){
            roomMember[roomId].push(userName);
        };
        roomScore[userName] = 0;
        if (typeof roomInfo[roomId] == 'undefined'){
            roomInfo[roomId] = 'waiting';
        }
        io.emit('lobby', roomInfo, roomMember);
        io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
        io.to(roomId).emit('member', roomMember[roomId]);
        io.to(roomId).emit('score', roomScore);
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomDraw[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on("disconnect", () => {
        roundChange[leaveRoomId] = false;
        const leaveUser = roomMember[leaveRoomId];
        const leaveRound = roomDraw[leaveRoomId];
        if (typeof(roomMember[leaveRoomId]) != 'undefined'){
            if (userName == leaveUser[leaveRound]){
                roundChange[leaveRoomId] =true;
            };
            const index = roomMember[leaveRoomId].indexOf(userName);
            if (index !== -1) {
            roomMember[leaveRoomId].splice(index, 1);
            };
            if (roomMember[leaveRoomId].length == 1){
                roomInfo[leaveRoomId] = 'waiting';
            }
            if (roomMember[leaveRoomId].length == 0){
                delete roomInfo[leaveRoomId];
                delete roomMember[leaveRoomId];
                delete roomScore[userName];
                delete roomDraw[leaveRoomId];
                delete roundChange[leaveRoomId];
                delete topic[leaveRoomId];
            };
        };
        socket.leave(leaveRoomId); 
        io.emit('lobby', roomInfo, roomMember);
        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
        io.to(leaveRoomId).emit('member', roomMember[leaveRoomId]);
        io.to(leaveRoomId).emit('score', roomScore);
        io.to(leaveRoomId).emit('roomStatus', roomInfo[leaveRoomId], roomMember[leaveRoomId], roomDraw[leaveRoomId], topic[leaveRoomId], roundChange[leaveRoomId]);
    });

    //聊天室
    socket.on('guess', (msg, roomId) => {
        io.to(roomId).emit('guess', msg, userName);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

    socket.on('nextDraw', (roomId) => {
        let users = roomMember[roomId];
        let round = roomDraw[roomId];
        io.to(roomId).emit('nextDraw', users[round]);
    });

    socket.on('lose', (roomId, topic) => {
        io.to(roomId).emit('lose', topic);
    })

    //畫畫
    socket.on('beginDraw', (point, roomId) => {
        socket.broadcast.to(roomId).emit('beginDraw', point);
    });

    socket.on('draw', (point, roomId) => {
        socket.broadcast.to(roomId).emit('draw', point);
     });

    socket.on('endDraw', (roomId) => {
        socket.broadcast.to(roomId).emit('endDraw');
    });

    socket.on('brushChanged', (roomId, color, width) => {
        socket.broadcast.to(roomId).emit('brushChanged', color, width);
    });

    //遊戲流程
    socket.on('beginGame', (roomId) => {
        roundChange[roomId] = true;
        roomRound[roomId] = 1;
        roomInfo[roomId] = 'playing';
        roomDraw[roomId] = 0;
        if (!topicIndex[roomId]){
            topicIndex[roomId] = [];
        };
        let str='';
        topicIndex[roomId] = [];
        for(i=0; i<topicsLength; i++){
            str = Math.round(Math.random()*topicsLength);
            for(j=0;j<topicIndex[roomId].length;j++){
                    if(topicIndex[roomId][j] == str){
                        topicIndex[roomId].splice(j,1);
                        i--;
                    };
                    if(topicIndex[roomId][j] == topicsLength){
                        topicIndex[roomId].splice(j,1);
                    };
                };
            topicIndex[roomId].push(str);
        };
        // console.log(topicIndex[roomId])
        let round = roomRound[roomId];
        topic[roomId] = topics[topicIndex[roomId][round]];
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomDraw[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on('win', (roomId, user) => {
        roundChange[roomId] = true;
        roomRound[roomId] ++;
        let Users = roomMember[roomId];
        let round = roomDraw[roomId];
        let drawUser = Users[round];
        roomScore[drawUser] ++;
        roomScore[user] ++;
        if (typeof(roomMember[roomId]) != 'undefined'){
            if (roomDraw[roomId]+1 == roomMember[roomId].length){
                roomDraw[roomId] = 0;
            }else{
                roomDraw[roomId] ++;
            };
        };
        let nextRound = roomRound[roomId];
        topic[roomId] = topics[topicIndex[roomId][nextRound]];
        io.to(roomId).emit('winScore', roomScore[user], user, roomScore[drawUser], drawUser);
        io.to(roomId).emit('winMessage', user);
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomDraw[roomId], topic[roomId], roundChange[roomId]);
    });

    socket.on('nextRound', (roomId) => {
        roundChange[roomId] = true;
        roomRound[roomId] ++;
        if (typeof(roomMember[roomId]) != 'undefined'){
            if (roomDraw[roomId]+1 == roomMember[roomId].length){
                roomDraw[roomId] = 0;
            }else{
                roomDraw[roomId] ++;
            };
        };
        let round = roomRound[roomId];
        topic[roomId] = topics[topicIndex[roomId][round]];
        io.to(roomId).emit('roomStatus', roomInfo[roomId], roomMember[roomId], roomDraw[roomId], topic[roomId], roundChange[roomId]);
    })

    socket.on('getTime', (roomId, count) => {
        socket.broadcast.to(roomId).emit('getTime', count);
    });

    socket.on('stopTime', (roomId) => {
        socket.broadcast.to(roomId).emit('stopTime');
    })
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
