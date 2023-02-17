const socket = io();

socket.emit('getRoom');

const newRoom = document.querySelector('.button');
const create = document.querySelector('.remind-button');
const set = document.querySelector('.remind');
const wrap = document.querySelector('.wrap');
const noRoom = document.querySelector('.no-room');

document.querySelector('.close').addEventListener('click', (e) => {
    e.preventDefault();
    set.style.display = 'none';
})

newRoom.addEventListener('click', (e) => {
    e.preventDefault();
    set.style.display = 'block';
});

create.addEventListener('click', (e) => {
    e.preventDefault();
    const maxMember = document.getElementById('max').value;
    const maxScore = document.getElementById('score').value;
    const public = document.querySelector('[name=public]:checked').value;
    socket.emit('createRoom', maxMember, maxScore, public);
    socket.on('createRoom', (roomId) => {
        window.location.href = '/draw?room=' + roomId;
    });
});

socket.on('lobby', async(roomInfo, roomMember, roomMax, roomPublic) => {
    const block = document.querySelectorAll(".block");
    for (i = 0; i<block.length; i++){
        block[i].remove();
    };
    const allRoomId = Object.keys(roomInfo); 
    const allRoomInfo = Object.values(roomInfo); 
    const allRoomMember = Object.values(roomMember); 
    const allRoomMax = Object.values(roomMax); 
    const allRoomPublic = Object.values(roomPublic); 
    if (!allRoomPublic.includes('public')){
        noRoom.style.display = 'block';
    }else{
        for (let i=0; i<allRoomInfo.length; i++){
            noRoom.style.display = 'none';
            const roomBlock = document.createElement('a');
            const roomOwner = document.createElement('div');
            const roomMemberBlock = document.createElement('div');
            roomBlock.className = 'block';
            if (allRoomPublic[i]){
                if (allRoomMember[i].length >= allRoomMax[i]){
                    roomMemberBlock.textContent = '額滿';
                    roomMemberBlock.className = 'memberText';
                }else{
                    roomMemberBlock.textContent = '人數：'+ allRoomMember[i].length;
                    roomMemberBlock.className = 'memberText';
                    roomBlock.href = '/draw?room='+allRoomId[i];
                }
                roomOwner.textContent = '房主：'+allRoomMember[i][0];
                roomOwner.className = 'ownerText';
                roomBlock.appendChild(roomOwner);
                roomBlock.appendChild(roomMemberBlock);
                wrap.appendChild(roomBlock);
            };
        };
    };
});