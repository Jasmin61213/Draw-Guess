const express = require('express');
const app = express();
const port = 3000;
const http = require('http');
const server = http.createServer(app);

const authRoute = require("./routes/auth");

require('dotenv').config();

const session = require('express-session');

const sessionMiddleware = session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge: 1000*60*60*24
    }
});

// redis
const redis = require("redis");
const client = redis.createClient(
    {url: `redis://${process.env.redis}`}
);
client.on("connect", function() {
  console.log('redis connected!');
});
const {HGET, HGETALL, HKEYS, HVALS} = require('./redis')

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
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const io = new Server(server);

const pubClient = createClient(
    {url: `redis://${process.env.redis}`}
);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

const allRoomInfo = {};
const timers = {};
const restTimers = {};
const counts = {};
const restCounts = {};
let timer;
let restTimer;
// let count;
const topics = [
    '向日葵','口紅','青蛙','光頭','西瓜','獅子','耳朵','皮卡丘','立可帶','警車',
    '腳踏車','鋼琴','台鐵','棉花糖','麥當勞漢堡','翻車魚','望遠鏡','相機','螞蟻','牛頭馬面',
    '海馬','耳機','手機','珍珠奶茶','時鐘','手錶','麥當勞薯條','馬鈴薯','番茄','菠菜',
    '老師','黑板','電風扇','國旗','口罩','枕頭','棉被','滅火器','警察','鴕鳥','電腦',
    '企鵝','老鷹','熊貓','穿山甲','袋鼠','洗衣機','電視','糖葫蘆','拉麵','火鍋','高速公路','高鐵',
    '長頸鹿','鸚鵡','內褲','音響','安全帽','豆漿','吉他','弓箭','鯨魚','紅綠燈','斑馬線','火影忍者','外星人',
    '大隊接力','美人魚','雪人','馬桶','地圖','飛機','羊入虎口','鴨嘴獸泰瑞','海綿寶寶','旋轉木馬','葡萄汁',
    '虎頭蛇尾','仙人掌','對牛彈琴','七上八下','吸血鬼','機器人','恐龍','蚊子','螢火蟲','毛毛蟲','一石二鳥',
    '火龍果','螞蟻上樹','摩斯漢堡','櫻花','除濕機','廚師','外套','暴龍','翼手龍','衛生紙','聖誕花圈','手槍',
    '雞飛狗跳','熱氣球','暖暖包','漫畫','公主','白馬王子','睡美人','白雪公主','小矮人','神燈','電蚊拍','鳥居',
    '神社','流氓','西洋劍','魟魚','垃圾袋','垃圾車','啤酒','泡菜','煙火','牛仔褲','章魚燒','鰻魚飯','三明治',
    '炒麵麵包','麥克風','米老鼠','三眼怪','麥克華斯基','迪士尼','火箭隊'
];
const topicsLength = topics.length;

io.on('connection', (socket) => {
    const userName = socket.request.session.user;
    url = socket.request.headers.referer;
    const leaveRoomId = url.split('=')[1];

    //lobby
    socket.on('getRoom', async() => {
        const allRoomId = await HKEYS('roomMember');
        const allRoomMember = await HVALS('roomMember');
        const allRoomMax = await HVALS('roomMaxMember');
        const allRoomPublic = await HVALS('roomPublic');
        const allRoomStatus = await HVALS('roomStatus');
        io.emit('lobby', allRoomId, allRoomMember, allRoomMax, allRoomPublic, allRoomStatus);
    });

    socket.on('checkRoom', async(roomId) => {
        let check;
        let room = await HGET('host', roomId);
        if (room){
            check = true;
        }else{
            check = false;
        };
        io.to(socket.id).emit('checkRoom', check);
    });

    //rooms
    socket.on('createRoom', async(maxMember, maxScore, publics) => {
        const roomId = Date.now();
        let room = {};
        client.HSET('roomMaxMember', roomId, maxMember);
        client.HSET('roomMaxScore', roomId, maxScore);
        client.HSET('roomPublic', roomId, publics);
        client.HSET('host', roomId, userName);
        client.HSET('roomDraw',  roomId, 0);
        client.HSET('drawer', roomId, userName);
        client.HSET('roomStatus', roomId, 'waiting');
        client.HSET('roomMember', roomId, 'Host');
        client.HSET('correctNum', roomId, 0);
        allRoomInfo[roomId] = room;
        socket.emit('createRoom', roomId);
    });

    socket.on('joinRoom', async(roomId) => {
        socket.join(roomId);
        let roomMembers;
        let roomMemberString  = await HGET('roomMember', roomId);
        if (roomMemberString){
            if (roomMemberString == 'Host'){
                roomMembers = [];
            }else{
                roomMembers = roomMemberString.split(',');
            };
            let thisRoom = allRoomInfo[roomId];
            if (typeof(thisRoom) != 'undefined'){
                if(!roomMembers.includes(userName)){
                    roomMembers.push(userName);
                    client.HSET('roomMember', roomId, roomMembers.toString());
                };
                client.HSET('roomScore', userName, 0);
                const allRoomId = await HKEYS('roomMember');
                const allRoomMember = await HVALS('roomMember');
                const allRoomMax = await HVALS('roomMaxMember');
                const allRoomPublic = await HVALS('roomPublic');
                const allRoomStatus = await HVALS('roomStatus');
                io.emit('lobby', allRoomId, allRoomMember, allRoomMax, allRoomPublic, allRoomStatus);

                io.to(roomId).emit('connectToRoom', `${userName}加入了！`);

                let roomMember = await HGET('roomMember', roomId);
                let roomScore = await HGETALL('roomScore');
                let roomMaxScore = await HGET('roomMaxScore', roomId);
                let roomStatus = await HGET('roomStatus', roomId);
                let host = await HGET('host', roomId);
                let roomDraw = await HGET('roomDraw', roomId);
                let drawer = await HGET('drawer', roomId);
                io.to(roomId).emit('member', roomMember);
                io.to(roomId).emit('score', roomScore);
                io.to(socket.id).emit('roomMaxScore', roomMaxScore);
                io.to(roomId).emit('roomInfo', roomStatus, host, roomMember, thisRoom.topic, roomDraw, drawer);
            };
        };
    });

    socket.on('getTimer' , async(roomId) => {
            let roomStatus = await HGET('roomStatus', roomId);
            io.to(socket.id).emit('getTimer', counts[roomId], restCounts[roomId], roomStatus);
    });

    socket.on("disconnect", async() => {
        let thisRoom = allRoomInfo[leaveRoomId];
        socket.leave(leaveRoomId); 
        if (typeof(leaveRoomId) != 'undefined'){
            let roomStatus = await HGET('roomStatus', leaveRoomId);
            let host = await HGET('host', leaveRoomId);
            let drawer = await HGET('drawer', leaveRoomId);
            let roomDraw = Number(await HGET('roomDraw', leaveRoomId));
            let correctNum = Number(await HGET('correctNum', leaveRoomId));
            let roomMembers;
            let roomMemberString  = await HGET('roomMember', leaveRoomId);
            if (typeof(thisRoom) != 'undefined'){
                if (roomMemberString){
                    //delete player
                    if (roomMemberString == '[]'){
                        roomMembers = [];
                    }else{
                        roomMembers = roomMemberString.split(',');
                    };
                    const index = roomMembers.indexOf(userName);
                    if (index !== -1) {
                        roomMembers.splice(index, 1);
                        client.HSET('roomMember', leaveRoomId, roomMembers.toString());
                    };
                    client.HDEL('roomScore', userName);

                    if (typeof(userName) != 'undefined'){
                        io.to(leaveRoomId).emit('leaveRoom', `${userName}離開了！`);
                    };

                    if (roomStatus == 'playing'){
                        if (userName == host){
                            client.HSET('host', leaveRoomId, roomMembers[0]);
                        };

                        if (userName == drawer){
                            client.HSET('roomStatus', leaveRoomId, 'resting');
                            if (roomDraw +1 == roomMembers.length){
                                client.HSET('roomDraw', leaveRoomId, 0);
                                roomDraw = 0;
                            };
                            drawer = roomMembers[roomDraw];
                            client.HSET('drawer', leaveRoomId, drawer);
                            io.to(leaveRoomId).emit('nextDrawer', drawer);
                            io.to(leaveRoomId).emit('stopTimer');
                            io.to(leaveRoomId).emit('stopGetTimer');
                            let host = await HGET('host', leaveRoomId);
                            io.to(leaveRoomId).emit('startTimer', 'resting', host);
                        };

                        if (roomDraw == roomMembers.length){
                            roomDraw = 0;
                            client.HSET('roomDraw', leaveRoomId, 0);
                            drawer = roomMembers[roomDraw];
                            client.HSET('drawer', leaveRoomId, drawer);
                        };

                        if (roomMembers.length == 1){
                            clearInterval(timers[leaveRoomId]);
                            clearInterval(restTimers[leaveRoomId]);
                            delete timers[leaveRoomId];
                            delete restTimers[leaveRoomId];
                            io.to(leaveRoomId).emit('stopTimer');
                            io.to(leaveRoomId).emit('stopRestTimer');
                            io.to(leaveRoomId).emit('stopGetTimer');
                            client.HSET('correctNum', leaveRoomId, 0);
                            client.HSET('roomStatus', leaveRoomId, 'waiting');
                        }else if (correctNum +1 >= roomMembers.length){
                            clearInterval(timers[leaveRoomId]);
                            clearInterval(restTimers[leaveRoomId]);
                            delete timers[leaveRoomId];
                            delete restTimers[leaveRoomId];
                            client.HSET('correctNum', leaveRoomId, 0);
                            client.HSET('roomStatus', leaveRoomId, 'resting');
                            if (roomDraw +1 == roomMembers.length){
                                client.HSET('roomDraw', leaveRoomId, 0);
                                roomDraw = 0;
                            }else{
                                client.HINCRBY('roomDraw', leaveRoomId, 1);
                                roomDraw ++;
                            };
                            drawer = roomMembers[roomDraw];
                            client.HSET('drawer', leaveRoomId, drawer);
                            io.to(leaveRoomId).emit('everyoneCorrected');
                            io.to(leaveRoomId).emit('nextDrawer', drawer);
                            io.to(leaveRoomId).emit('stopTimer');
                            io.to(leaveRoomId).emit('stopGetTimer');
                            let host = await HGET('host', leaveRoomId);
                            io.to(leaveRoomId).emit('startTimer', 'resting', host);
                        };
                    };

                    if (roomStatus == 'resting'){
                        if (userName == host){
                            client.HSET('host', leaveRoomId, roomMembers[0]);
                        };

                        if (roomDraw == roomMembers.length){
                            roomDraw = 0;
                            client.HSET('roomDraw', leaveRoomId, 0);
                            drawer = roomMembers[0];
                            client.HSET('drawer', leaveRoomId, drawer);
                            io.to(leaveRoomId).emit('nextDrawer', drawer);
                        }else if (userName == drawer){
                            drawer = roomMembers[roomDraw];
                            client.HSET('drawer', leaveRoomId, drawer);
                            io.to(leaveRoomId).emit('nextDrawer', drawer);
                        };

                        if (roomMembers.length == 1){
                            clearInterval(restTimers[leaveRoomId]);
                            delete restTimers[leaveRoomId];
                            io.to(leaveRoomId).emit('stopRestTimer');
                            io.to(leaveRoomId).emit('stopGetTimer');
                            client.HSET('correctNum', leaveRoomId, 0);
                            client.HSET('roomStatus', leaveRoomId, 'waiting');
                        };
                    };

                    if (roomStatus == 'ending'){
                        if (userName == host){
                            client.HSET('host', leaveRoomId, roomMembers[0]);
                        };
                    };

                    if (roomMembers.length == 0){
                        client.HDEL('host', leaveRoomId);
                        client.HDEL('drawer', leaveRoomId);
                        client.HDEL('correctNum', leaveRoomId);
                        client.HDEL('roomMaxMember', leaveRoomId);
                        client.HDEL('roomStatus', leaveRoomId);
                        client.HDEL('roomMaxScore', leaveRoomId);
                        client.HDEL('roomPublic', leaveRoomId);
                        client.HDEL('roomMember', leaveRoomId);
                        client.HDEL('roomDraw', leaveRoomId);
                        client.HDEL('roomRound', leaveRoomId);
                        delete allRoomInfo[leaveRoomId];
                        clearInterval(timers[leaveRoomId]);
                        clearInterval(restTimers[leaveRoomId]);
                        delete timers[leaveRoomId];
                        delete restTimers[leaveRoomId];
                    };
                };

                const allRoomId = await HKEYS('roomMember');
                const allRoomMember = await HVALS('roomMember');
                const allRoomMax = await HVALS('roomMaxMember');
                const allRoomPublic = await HVALS('roomPublic');
                const allRoomStatus = await HVALS('roomStatus');
                io.emit('lobby', allRoomId, allRoomMember, allRoomMax, allRoomPublic, allRoomStatus);

                let roomMember = await HGET('roomMember', leaveRoomId);
                io.to(leaveRoomId).emit('member', roomMember);
                let roomScore = await HGETALL('roomScore');
                io.to(leaveRoomId).emit('score', roomScore);
                let roomStatusNew = await HGET('roomStatus', leaveRoomId);
                let hostNew = await HGET('host', leaveRoomId);
                let roomDrawNew = await HGET('roomDraw', leaveRoomId);
                let drawerNew = await HGET('drawer', leaveRoomId);
                io.to(leaveRoomId).emit('roomInfo', roomStatusNew, hostNew, roomMember, thisRoom.topic, roomDrawNew, drawerNew);
            };
        };
    });

    //game system
    socket.on('beginGame', async(roomId) => {
        let thisRoom = allRoomInfo[roomId];
        client.HSET('roomRound', roomId, 1);
        client.HSET('roomStatus', roomId, 'playing');

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
        thisRoom.topic = topics[thisRoom.topicIndex[1]];

        allRoomInfo[roomId] = thisRoom;
        let roomMember = await HGET('roomMember', roomId);
        let host = await HGET('host', roomId);
        let roomDraw = await HGET('roomDraw', roomId);
        let drawer = await HGET('drawer', roomId);
        io.to(roomId).emit('roomInfo', 'playing', host, roomMember, thisRoom.topic, roomDraw, drawer);
        io.to(roomId).emit('startTimer', 'playing', host);
        io.emit(allRoomInfo[roomId]);        
    });

    socket.on('win', async(roomId, user) => {
        let thisRoom = allRoomInfo[roomId];
        let roomMembers = await HGET('roomMember', roomId);
        let roomMember = roomMembers.split(',');
        let correctNum = Number(await HGET('correctNum', roomId));
        let drawer = await HGET('drawer', roomId);
        if (correctNum <= 5){
            client.HINCRBY('roomScore', drawer, 1);
        };
        client.HINCRBY('roomScore', user, 2);
        let userScore = Number(await HGET('roomScore', user));
        let drawerScore = Number(await HGET('roomScore', drawer));
        io.to(roomId).emit('winScore', userScore, user, drawerScore, drawer);

        client.HINCRBY('correctNum', roomId, 1);
        correctNum ++;
        let roomMaxScore = Number(await HGET('roomMaxScore', roomId));
        if (userScore >= roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            client.HSET('roomStatus', roomId, 'ending');
            io.to(roomId).emit('winnerUser', user);
            let host = await HGET('host', roomId);
            let roomDraw = await HGET('roomDraw', roomId);
            let drawer = await HGET('drawer', roomId);
            io.to(roomId).emit('roomInfo', 'ending', host, roomMembers, thisRoom.topic, roomDraw, drawer);
        }else if (drawerScore >= roomMaxScore){
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            client.HSET('roomStatus', roomId, 'ending');
            io.to(roomId).emit('winnerDraw', drawer);
            let host = await HGET('host', roomId);
            let roomDraw = await HGET('roomDraw', roomId);
            let drawer = await HGET('drawer', roomId);
            io.to(roomId).emit('roomInfo', 'ending', host, roomMembers, thisRoom.topic, roomDraw, drawer);
        }else if (correctNum +1 >= roomMember.length){
            let roomDraw = Number(await HGET('roomDraw', roomId));
            client.HSET('correctNum', roomId, 0);
            client.HSET('roomStatus', roomId, 'resting');
            clearInterval(timers[roomId]);
            clearInterval(restTimers[roomId]);
            delete timers[roomId];
            delete restTimers[roomId];

            if (roomDraw +1 == roomMember.length){
                client.HSET('roomDraw', roomId, 0);
                roomDraw = 0;
            }else{
                client.HINCRBY('roomDraw', roomId, 1);
                roomDraw ++;
            };
            drawer = roomMember[roomDraw];
            client.HSET('drawer', roomId, drawer);

            allRoomInfo[roomId] = thisRoom;
            let host = await HGET('host', roomId);
            io.to(roomId).emit('stopTimer');
            io.to(roomId).emit('stopGetTimer');
            io.to(roomId).emit('startTimer', 'resting', host);
            io.to(roomId).emit('roomInfo', 'resting', host, roomMembers, thisRoom.topic, roomDraw, drawer);
            io.to(roomId).emit('everyoneCorrected');
            io.to(roomId).emit('nextDrawer', drawer);
        };
    });

    socket.on('startTimer', async(roomId) => {
        let count = 100;
        let min = 1/64;
        if (!timers[roomId]){
            timer = setInterval(async() =>{
                count -= min;
                counts[roomId] = count;
                if (count <= 0) {
                    let roomDraw = Number(await HGET('roomDraw', roomId));
                    let roomMembers = await HGET('roomMember', roomId);
                    let roomMember = roomMembers.split(',');
                    let drawer = await HGET('drawer', roomId);
                    clearInterval(timers[roomId]);
                    delete timers[roomId];
                    let thisRoom = allRoomInfo[roomId];
                    client.HSET('roomStatus', roomId, 'resting');

                    if (roomDraw +1 == roomMember.length){
                        client.HSET('roomDraw', roomId, 0);
                        roomDraw = 0;
                    }else{
                        client.HINCRBY('roomDraw', roomId, 1);
                        roomDraw ++;
                    };
                    drawer = roomMember[roomDraw];
                    client.HSET('drawer', roomId, drawer);

                    let host = await HGET('host', roomId);
                    io.to(roomId).emit('roomInfo', 'resting', host, roomMembers, thisRoom.topic, roomDraw, drawer);
                    io.to(roomId).emit('nextDrawer', drawer);
                    io.to(roomId).emit('lose', thisRoom.topic);
                    io.to(roomId).emit('stopTimer');
                    io.to(roomId).emit('stopGetTimer');
                    io.to(roomId).emit('startTimer', 'resting', host);
                };
            }, 10);
        };
        timers[roomId] = timer;
    });

    socket.on('startRestTimer', async(roomId) => {
        let restCount = 100;
        let restMin = 1/8;
        if (!restTimers[roomId]){
            restTimer = setInterval(async() =>{
            restCount -= restMin;
            restCounts[roomId] = restCount;
            if (restCount <= 0) {
                let thisRoom = allRoomInfo[roomId];
                let host = await HGET('host', roomId);
                let roomDraw = Number(await HGET('roomDraw', roomId));
                let drawer = await HGET('drawer', roomId);
                let roomMembers = await HGET('roomMember', roomId);
                clearInterval(restTimers[roomId]);
                delete restTimers[roomId];
                client.HSET('roomStatus', roomId, 'playing');

                let roomRound = Number(await HGET('roomRound', roomId));
                roomRound ++;
                client.HINCRBY('roomRound', roomId, 1);

                thisRoom.topic = topics[thisRoom.topicIndex[roomRound]];
                allRoomInfo[roomId] = thisRoom;
                io.to(roomId).emit('roomInfo', 'playing', host, roomMembers, thisRoom.topic, roomDraw, drawer);
                io.to(roomId).emit('drawer', drawer);
                io.to(roomId).emit('stopRestTimer');
                io.to(roomId).emit('stopGetTimer');
                io.to(roomId).emit('startTimer', 'playing', host);
                };
            }, 10);
        };
        restTimers[roomId] = restTimer;
    });

    socket.on('refresh', async(roomId) => {
        let roomMembers;
        let roomMemberString  = await HGET('roomMember', leaveRoomId);
        if (roomMemberString == '[]'){
            roomMembers = [];
        }else{
            roomMembers = roomMemberString.split(',');
        };
        let thisRoom = allRoomInfo[roomId];
        client.HSET('roomStatus', roomId, 'waiting');

        roomDraw = 0;
        client.HSET('roomDraw', roomId, 0);

        correctNum = 0;
        client.HSET('correctNum', roomId, 0);

        drawer = roomMembers[0];
        client.HSET('drawer', roomId, drawer);

        for (let i = 0; i<roomMembers.length; i++) {
            client.HSET('roomScore', roomMembers[i], 0);
        };

        delete thisRoom.topic;
        allRoomInfo[roomId] = thisRoom;
        let roomScore = await HGETALL('roomScore');
        let host = await HGET('host', roomId);
        io.to(roomId).emit('member', roomMemberString);
        io.to(roomId).emit('score', roomScore);
        io.to(roomId).emit('roomInfo', 'waiting', host, roomMemberString, thisRoom.topic, roomDraw, drawer);
    });

    //聊天室
    socket.on('guess', (msg, roomId, win) => {
        io.to(roomId).emit('guess', msg, win);
    });

    socket.on('chat', (msg, roomId) => {
        io.to(roomId).emit('chat', msg, userName);
    });

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
});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});