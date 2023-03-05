const remind = document.querySelector('.remind');
const remindText = document.querySelector('.remind-text');
const remindButton = document.querySelector('.remind-button');

//驗證登入者
let user;
async function login(){
    const response = await fetch('/api/auth/getLogin');
    const res = await response.json();
    if (res.ok == true){
        window.location.href = '/lobby';
    };
};
if (document.readyState === "complete"){
    login();
}else{
    document.addEventListener("DOMContentLoaded", login);
};

remindButton.addEventListener('click', (e) => {
    e.preventDefault();
    remind.style.display = 'none';
});

function signIn(){
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;

    data = {
        'email':email,
        'password':password
    };
    fetch('/api/auth/login',{
        method: 'POST',
        body: JSON.stringify(data),
        cache: "no-cache",
        headers:{
            "Accept" : "application/json",
            "Content-Type" : "application/json"
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        if (res.ok == true){
            window.location.href = '/lobby';
        };
        if (res.error == true){
            remind.style.display = 'block';
            remindText.textContent = res.message;
        };
    });
};

function signUp(){
    let user = document.getElementById('username').value;
    let email = document.getElementById('signup-email').value;
    let password = document.getElementById('signup-password').value;
    data = {
        'name':user,
        'email':email,
        'password':password
    };
    fetch('/api/auth/signup',{
        method: 'POST',
        body: JSON.stringify(data),
        cache: "no-cache",
        headers:{
            "Accept" : "application/json",
            "Content-Type" : "application/json"
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(res){
        if (res.ok == true){
            signInButton.style.backgroundColor = '#ECE2D0';
            signUpButton.style.backgroundColor = '#fff';
            signInDiv.style.display = 'flex';
            signUpDiv.style.display = 'none';
        }
        if (res.error == true){
            remind.style.display = 'block';
            remindText.textContent = res.message;
        };
    });
};

const signInButton = document.querySelector('.sign-in-title');
const signUpButton = document.querySelector('.sign-up-title');
const signInDiv = document.querySelector('.sign-in-input-div');
const signUpDiv = document.querySelector('.sign-up-input-div');

signInButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInButton.style.backgroundColor = '#ECE2D0';
    signUpButton.style.backgroundColor = '#fff';
    signInDiv.style.display = 'flex';
    signUpDiv.style.display = 'none';
});

signUpButton.addEventListener('click', (e) => {
    e.preventDefault();
    signInButton.style.backgroundColor = '#fff';
    signUpButton.style.backgroundColor = '#ECE2D0';
    signInDiv.style.display = 'none';
    signUpDiv.style.display = 'flex';
});