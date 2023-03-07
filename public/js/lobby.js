const socket = io();

//驗證登入者
let user;
async function login(){
    const response = await fetch('/api/auth/getLogin');
    const res = await response.json();
    if (res.ok == true){
        user = res.user;
        console.log(res.user)
        document.querySelector('.name').textContent = res.user;
    };
    if (res.error == true){
        window.location.href = '/';
    };
};
if (document.readyState === "complete"){
    login();
}else{
    document.addEventListener("DOMContentLoaded", login);
};

const getRooms = setInterval(() =>{
    socket.emit('getRoom');
}, 1000);

const newRoom = document.querySelector('.button');
const create = document.querySelector('.remind-button');
const set = document.querySelector('.remind');
const wrap = document.querySelector('.wrap');
const noRoom = document.querySelector('.no-room');
const change = document.querySelector('.change');
const userName = document.querySelector('.name');

document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    async function logout(){
        const response = await fetch('/api/auth/logout',{
            method : 'DELETE'
        });
        const res = await response.json();
        if (res.ok == true){
            window.location.href = '/';
        };
    };
    logout();
});

userName.addEventListener('click', (e) => {
    e.preventDefault();
    change.style.display = 'block';
});

document.querySelector('.change-close').addEventListener('click', (e) => {
    e.preventDefault();
    change.style.display = 'none';
    document.querySelector('.alert').textContent = '';
});

document.querySelector('.change-button').addEventListener('click', (e) => {
    e.preventDefault();
    let inputName = document.getElementById('change-name').value;
    data = {
        'oldName' : user,
        'newName': inputName
    }
    async function changeName(){
        const response = await fetch('/api/auth/changeName', {
            method: 'POST',
            body: JSON.stringify(data),
            cache: "no-cache",
            headers:{
            "Accept" : "application/json",
            "Content-Type" : "application/json"
            }
        });
        const res = await response.json();
        if (res.ok == true){
            document.querySelector('.name').textContent = res.user;
            change.style.display = 'none';
        };
        if (res.error == true){
            document.querySelector('.alert').textContent = res.message;
        };
        document.getElementById('change-name').value = '';
    };
    changeName()
});

document.querySelector('.close').addEventListener('click', (e) => {
    e.preventDefault();
    set.style.display = 'none';
});

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

socket.on('lobby', (allRoomId, allRoomMembers, allRoomMax, allRoomPublic, allRoomStatus) => {
    console.log(allRoomId, allRoomMembers, allRoomMax, allRoomPublic, allRoomStatus)
    const block = document.querySelectorAll(".block");
    for (i = 0; i<block.length; i++){
        block[i].remove();
    };
    if (!allRoomPublic.includes('public')){
        noRoom.style.display = 'block';
    }else{
        for (let i=0; i<allRoomId.length; i++){
            const allRoomMember = allRoomMembers[i].split(',');
            noRoom.style.display = 'none';
            const roomBlock = document.createElement('a');
            const roomOwner = document.createElement('div');
            const roomMemberBlock = document.createElement('div');
            const roomStatusBlock = document.createElement('div');
            roomBlock.className = 'block';
            if (allRoomPublic[i]){
                if (allRoomMember.length >= allRoomMax[i]){
                    roomMemberBlock.textContent = 'FULL';
                    roomMemberBlock.className = 'memberText';
                    if (allRoomStatus[i] == 'waiting'){
                        roomStatusBlock.textContent = 'Waiting...';
                    }else if (allRoomStatus[i] == 'playing'){
                        roomStatusBlock.textContent = 'Playing...';
                    }else if (allRoomStatus[i] == 'resting'){
                        roomStatusBlock.textContent = 'Resting...';
                    }else{
                        roomStatusBlock.textContent = 'Winner！';
                    };
                    roomBlock.style.backgroundColor = '#efe6dd';
                    roomBlock.style.cursor = 'not-allowed';
                    roomStatusBlock.className = 'statusText';
                }else{
                    roomMemberBlock.textContent = `Players：${allRoomMember.length} / ${allRoomMax[i]}`;
                    roomMemberBlock.className = 'memberText';
                    if (allRoomStatus[i] == 'waiting'){
                        roomStatusBlock.textContent = 'Waiting....';
                        roomBlock.href = '/draw?room='+allRoomId[i];
                    }else if (allRoomStatus[i] == 'playing'){
                        roomStatusBlock.textContent = 'Playing...';
                        roomBlock.style.backgroundColor = '#efe6dd';
                        roomBlock.style.cursor = 'not-allowed';
                    }else if (allRoomStatus[i] == 'resting'){
                        roomStatusBlock.textContent = 'Resting...';
                        roomBlock.href = '/draw?room='+allRoomId[i];
                    }else{
                        roomStatusBlock.textContent = 'Winner！';
                        roomBlock.href = '/draw?room='+allRoomId[i];
                    };
                    roomStatusBlock.className = 'statusText';
                };
                roomOwner.textContent = 'Host：'+allRoomMember[0];
                roomOwner.className = 'ownerText';
                roomBlock.appendChild(roomOwner);
                roomBlock.appendChild(roomMemberBlock);
                roomBlock.appendChild(roomStatusBlock);
                wrap.appendChild(roomBlock);
            };
        };
    };
});