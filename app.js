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

// 引入模組
// const redis = require("redis");
// const bluebird = require("bluebird");
// const client = redis.createClient();
// // redis server
// client.on("connect", function() {
//   console.log('redis connected!');
// });
// bluebird.promisifyAll(redis.RedisClient.prototype);

const { Server } = require("socket.io");
const io = new Server(server);

// const { Server } = require("socket.io");
// const { createAdapter } = require("@socket.io/redis-adapter");
// const { createClient } = require("redis");

// const io = new Server(server);

// const pubClient = createClient();
// const subClient = pubClient.duplicate();

// io.adapter(createAdapter(pubClient, subClient));
// io.listen(3000);


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

//socket.io
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const allRoomInfo = {};
const roomScore = {};
const timers = {};
const restTimers = {};
let timer;
let restTimer;
const topics = [
    '向日葵','口紅','青蛙','光頭','西瓜','獅子','耳朵','皮卡丘','立可帶','警車',
    '腳踏車','鋼琴','台鐵','棉花糖','麥當勞漢堡','翻車魚','望遠鏡','相機','螞蟻','牛頭馬面',
    '海馬','耳機','手機','珍珠奶茶','時鐘','手錶','麥當勞薯條','馬鈴薯','番茄','菠菜',
    '老師','黑板','電風扇','國旗','口罩','枕頭','棉被','滅火器','警察','鴕鳥',
    '企鵝','老鷹','熊貓','穿山甲','袋鼠','洗衣機','電視','糖葫蘆','拉麵','火鍋',
    '長頸鹿','鸚鵡','內褲','音響','安全帽','豆漿','高速公路','高鐵','吉他','弓箭',
    '鯨魚','紅綠燈','斑馬線','火影忍者','外星人','大隊接力','美人魚','電腦','雪人','馬桶',
    '地圖','飛機','羊入虎口','鴨嘴獸泰瑞','海綿寶寶','旋轉木馬','葡萄汁','虎頭蛇尾','仙人掌','對牛彈琴',
    '七上八下','吸血鬼','機器人','恐龍','蚊子','螢火蟲','毛毛蟲','一石二鳥','火龍果','螞蟻上樹','摩斯漢堡'

];
const topicsLength = topics.length;

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //房間
    socket.on('getRoom',() => {
        io.emit('lobby', allRoomInfo);
    });

    socket.on('createRoom', (maxMember, maxScore, publics) => {
        const roomId = Date.now();
        let room = {};
        room.roomMaxMember = maxMember;
        room.roomMaxScore = maxScore;
        room.roomPublic = publics;
        room.host = userName;
        room.roomDraw = 0;
        room.drawer = userName;
        room.roomStatus = 'waiting';
        room.correctNum = 0;
        allRoomInfo[roomId] = room;
        socket.emit('createRoom', (roomId));
    });

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        let thisRoom = allRoomInfo[roomId];
        if (typeof(thisRoom) != 'undefined'){
            if (!thisRoom.roomMember){
                thisRoom.roomMember = [];
            };
            if(!thisRoom.roomMember.includes(userName)){
                thisRoom.roomMember.push(userName);
            };
            roomScore[userName] = 0;
            allRoomInfo[roomId] = thisRoom;
            io.emit('lobby', allRoomInfo)
            io.to(socket.id).emit('roomMaxScore', thisRoom.roomMaxScore);
            io.to(roomId).emit('connectToRoom', `${userName}加入了！`);
            io.to(roomId).emit('member', thisRoom.roomMember);
            io.to(roomId).emit('score', roomScore);
            io.to(roomId).emit('roomInfo', thisRoom);
        };
    });

    socket.on("disconnect", () => {
        let thisRoom = allRoomInfo[leaveRoomId];
        if (typeof(thisRoom) != 'undefined'){
            if (typeof(thisRoom.roomMember) != 'undefined'){
                const index = thisRoom.roomMember.indexOf(userName);
                if (index !== -1) {
                    thisRoom.roomMember.splice(index, 1);
                };
                if (thisRoom.roomStatus != 'ending'){
                    if (thisRoom.roomDraw == thisRoom.roomMember.length){
                        thisRoom.roomDraw = 0;
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                    };
                    if (userName == thisRoom.drawer){
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw]
                    };
                    
                    if (userName == thisRoom.host){
                        thisRoom.host = thisRoom.roomMember[0];
                    };
                    if (thisRoom.correctNum +1 >= thisRoom.roomMember.length){
                        thisRoom.correctNum = 0;
                        clearInterval(timers[leaveRoomId]);
                        clearInterval(restTimers[leaveRoomId]);
                        delete timers[leaveRoomId];
                        delete restTimers[leaveRoomId];
                        thisRoom.roomStatus = 'resting';
                        if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                            thisRoom.roomDraw = 0;
                        }else{
                            thisRoom.roomDraw ++;
                        };
                        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                        allRoomInfo[leaveRoomId] = thisRoom;
                        io.to(leaveRoomId).emit('everyoneCorrected');
                        io.to(leaveRoomId).emit('nextDrawer', thisRoom.drawer);
                    };
                    if (thisRoom.roomMember.length == 1){
                        clearInterval(timers[leaveRoomId]);
                        clearInterval(restTimers[leaveRoomId]);
                        delete timers[leaveRoomId];
                        delete restTimers[leaveRoomId];
                        thisRoom.correctNum = 0;
                        thisRoom.roomStatus = 'waiting';
                    };
                    allRoomInfo[leaveRoomId] = thisRoom;
                };
                
                if (thisRoom.roomMember.length == 0){
                    delete allRoomInfo[leaveRoomId];
                    clearInterval(timers[leaveRoomId]);
                    clearInterval(restTimers[leaveRoomId]);
                    delete timers[leaveRoomId];
                    delete restTimers[leaveRoomId];
                    delete roomScore.userName;
                };
            };
            if (typeof(userName) != 'undefined'){
                io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
            };
            socket.leave(leaveRoomId); 
            io.emit('lobby', allRoomInfo);
            io.to(leaveRoomId).emit('member', thisRoom.roomMember);
            io.to(leaveRoomId).emit('score', roomScore);
            io.to(leaveRoomId).emit('roomInfo', thisRoom);
        };
    });

    //聊天室
    socket.on('guess', (msg, roomId, win) => {
        io.to(roomId).emit('guess', msg, win);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
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
        let thisRoom = allRoomInfo[roomId];
        thisRoom.roomRound = 1;
        thisRoom.roomStatus = 'playing';
        if (!thisRoom.topicIndex){
            thisRoom.topicIndex = [];
        };
        let str='';
        thisRoom.topicIndex = [];
        for(i=0; i<topicsLength; i++){
            str = Math.round(Math.random()*topicsLength);
            for(j=0;j<thisRoom.topicIndex.length;j++){
                    if(thisRoom.topicIndex[j] == str){
                        thisRoom.topicIndex.splice(j,1);
                        i--;
                    };
                    if(thisRoom.topicIndex[j] == topicsLength){
                        thisRoom.topicIndex.splice(j,1);
                    };
                };
            thisRoom.topicIndex.push(str);
        };
        thisRoom.topic = topics[thisRoom.topicIndex[thisRoom.roomRound]];
        allRoomInfo[roomId] = thisRoom;
        io.to(roomId).emit('roomInfo', thisRoom);
    });

    socket.on('win', (roomId, user) => {
        let thisRoom = allRoomInfo[roomId];

        roomScore[thisRoom.drawer] ++;
        roomScore[user] +=2;
        io.to(roomId).emit('winScore', roomScore[user], user, roomScore[thisRoom.drawer], thisRoom.drawer);
        
        thisRoom.correctNum ++;
        if (roomScore[thisRoom.drawer] >= thisRoom.roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            thisRoom.roomStatus = 'ending';
            io.to(roomId).emit('winnerDraw', thisRoom.drawer)
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('roomInfo', thisRoom);
        } else if (roomScore[user] >= thisRoom.roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            thisRoom.roomStatus = 'ending';
            io.to(roomId).emit('winnerUser', user)
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('roomInfo', thisRoom);
        }else if (thisRoom.correctNum +1 >= thisRoom.roomMember.length){
            thisRoom.correctNum = 0;
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            thisRoom.roomStatus = 'resting';
            if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                thisRoom.roomDraw = 0;
            }else{
                thisRoom.roomDraw ++;
            };
            thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
            allRoomInfo[roomId] = thisRoom;
            io.to(roomId).emit('roomInfo', thisRoom);
            io.to(roomId).emit('everyoneCorrected');
            io.to(roomId).emit('nextDrawer', thisRoom.drawer);
        };
    });

    socket.on('startTimer', (roomId) => {
        let count = 100;
        let min = 1/60;
        if (!timers[roomId]){
            timer = setInterval(() =>{
            count -= min;
            io.to(roomId).emit('timer', count);
            if (count <= 0) {
                clearInterval(timers[roomId]);
                delete timers[roomId];
                count = 100;
                let thisRoom = allRoomInfo[roomId];
                thisRoom.roomStatus = 'resting';
                if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
                    thisRoom.roomDraw = 0;
                }else{
                    thisRoom.roomDraw ++;
                };
                thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
                allRoomInfo[roomId] = thisRoom;
                io.to(roomId).emit('roomInfo', thisRoom);
                io.to(roomId).emit('nextDrawer', thisRoom.drawer);
            };
        }, 10);
        }
        timers[roomId] = timer;
    });

    socket.on('stopTimer', (roomId) => {
        clearInterval(timers[roomId]);
        delete timers[roomId];
        count = 100;
        let thisRoom = allRoomInfo[roomId];
        thisRoom.roomStatus = 'resting';
        if (thisRoom.roomDraw +1 == thisRoom.roomMember.length){
            thisRoom.roomDraw = 0;
        }else{
            thisRoom.roomDraw ++;
        };
        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
        allRoomInfo[roomId] = thisRoom;
        io.to(roomId).emit('roomInfo', thisRoom);
        io.to(roomId).emit('nextDrawer', thisRoom.drawer);
    });

    socket.on('startRestTimer', (roomId) => {
        let restCount = 100;
        let restMin = 1/8;
        if (!restTimers[roomId]){
            restTimer = setInterval(() =>{
            restCount -= restMin;
            if (restCount <= 0) {
                clearInterval(restTimers[roomId]);
                delete restTimers[roomId];
                restCount = 100;
                let thisRoom = allRoomInfo[roomId];
                thisRoom.roomStatus = 'playing';
                thisRoom.roomRound ++;
                thisRoom.topic = topics[thisRoom.topicIndex[thisRoom.roomRound]];
                allRoomInfo[roomId] = thisRoom;
                io.to(roomId).emit('roomInfo', thisRoom);
                io.to(roomId).emit('drawer', thisRoom.drawer);
                io.to(roomId).emit('stopRestTimer');
                };
            }, 10);
        };
        restTimers[roomId] = restTimer;
    });

    socket.on('refresh', (roomId) => {
        let thisRoom = allRoomInfo[roomId];
        thisRoom.roomStatus = 'waiting';
        thisRoom.roomDraw = 0;
        thisRoom.correctNum = 0;
        thisRoom.drawer = thisRoom.roomMember[thisRoom.roomDraw];
        for (let i = 0; i<thisRoom.roomMember.length; i++) {
            roomScore[thisRoom.roomMember[i]] = 0;
        };
        delete thisRoom.topic;
        allRoomInfo[roomId] = thisRoom;
        io.to(roomId).emit('member', thisRoom.roomMember);
        io.to(roomId).emit('score', roomScore);
        io.to(roomId).emit('roomInfo', thisRoom);
    });
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});