const socket = io();
// const newsocket = io('/lobby')

socket.emit('getRoom')

const newRoom = document.querySelector('.button')
const wrap = document.querySelector('.wrap')
const roomBlock = document.createElement('a')
roomBlock.className = 'block'

newRoom.addEventListener('click', function(e) {
    e.preventDefault();
    fetch('/create-room')
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        console.log(res)
        // if (res.status == 200){
        window.location.href = '/draw?room=' + res.roomId;
        // };
    });
});

 // socket.emit('create-room');
    // socket.on('create-room', (roomId) => {
    //     window.location.href = '/draw?room='+ roomId;
        // socket.emit('join-room-one', roomId, roomInfo)
        // console.log(roomInfo)
        // allRoomInfo.push(roomInfo)
        // console.log(allRoomInfo)

// socket.on('lobby', async(roomId, roomInfo, roomMember) => {
//     const block = document.querySelectorAll(".block")
//     for (i = 0; i<block.length; i++){
//         block[i].remove();
//     };
//     // const allRoomId = Object.keys(roomInfo); 
//     // const allRoomInfo = Object.values(roomInfo); 
//     // const allRoomMember = Object.values(roomMember); 
//     // for (let i=0; i<roomInfo.length; i++){
//         const roomBlock = document.createElement('a')
//         const roomOwner = document.createElement('div')
//         const roomMemberBlock = document.createElement('div')
//         // roomBlock.id = roomId;
//         roomBlock.className = 'block';
//         roomBlock.href = '/draw?room='+roomId;
//         roomOwner.textContent = '房主：'+roomInfo[roomId];
//         roomOwner.className = 'ownerText';
//         roomMemberBlock.textContent = '人數：'+ roomMember[roomId].length;
//         roomMemberBlock.className = 'memberText';
//         roomBlock.appendChild(roomOwner);
//         roomBlock.appendChild(roomMemberBlock);
//         wrap.appendChild(roomBlock);
//     // }
// });

socket.on('lobby', async(roomInfo, roomMember) => {
    const block = document.querySelectorAll(".block")
    for (i = 0; i<block.length; i++){
        block[i].remove();
    };
    const allRoomId = Object.keys(roomInfo); 
    const allRoomInfo = Object.values(roomInfo); 
    const allRoomMember = Object.values(roomMember); 
    for (let i=0; i<allRoomInfo.length; i++){
        const roomBlock = document.createElement('a')
        const roomOwner = document.createElement('div')
        const roomMemberBlock = document.createElement('div')
        // roomBlock.id = roomId;
        roomBlock.className = 'block';
        roomBlock.href = '/draw?room='+allRoomId[i];
        roomOwner.textContent = '房主：'+allRoomMember[i][0];
        roomOwner.className = 'ownerText';
        roomMemberBlock.textContent = '人數：'+ allRoomMember[i].length;
        roomMemberBlock.className = 'memberText';
        roomBlock.appendChild(roomOwner);
        roomBlock.appendChild(roomMemberBlock);
        wrap.appendChild(roomBlock);
    }
});

// socket.on('leaveRoom',(leaveRoomId) => {
//     const leaveRoom = document.getElementById(leaveRoomId) ;
//     console.log(leaveRoom)
//     leaveRoom.remove();
// })