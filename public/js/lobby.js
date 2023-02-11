const socket = io();

socket.emit('getRoom');

const newRoom = document.querySelector('.button');
const wrap = document.querySelector('.wrap');

newRoom.addEventListener('click', function(e) {
    e.preventDefault();
    fetch('/create-room')
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        // if (res.status == 200){
        window.location.href = '/draw?room=' + res.roomId;
        // };
    });
});

socket.on('lobby', async(roomInfo, roomMember) => {
    const block = document.querySelectorAll(".block");
    for (i = 0; i<block.length; i++){
        block[i].remove();
    };
    const allRoomId = Object.keys(roomInfo); 
    const allRoomInfo = Object.values(roomInfo); 
    const allRoomMember = Object.values(roomMember); 
    for (let i=0; i<allRoomInfo.length; i++){
        const roomBlock = document.createElement('a');
        const roomOwner = document.createElement('div');
        const roomMemberBlock = document.createElement('div');
        roomBlock.className = 'block';
        if (allRoomMember[i].length == 8){
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
});