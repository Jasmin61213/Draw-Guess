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

socket.emit('getRoom');

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

socket.on('lobby', (allRoomInfo) => {
    const block = document.querySelectorAll(".block");
    for (i = 0; i<block.length; i++){
        block[i].remove();
    };
    const allRoomId = Object.keys(allRoomInfo); 
    const allRoomMember = Object.values(allRoomInfo).map(item => item.roomMember);
    const allRoomMax = Object.values(allRoomInfo).map(item => item.roomMaxMember);
    const allRoomPublic = Object.values(allRoomInfo).map(item => item.roomPublic);
    if (!allRoomPublic.includes('public')){
        noRoom.style.display = 'block';
    }else{
        for (let i=0; i<allRoomId.length; i++){
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
                    roomMemberBlock.textContent = `人數：${allRoomMember[i].length} / ${allRoomMax[i]}`;
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