function postUser(){
    const user = document.getElementById('username').value;
    data = {
        'name':user
    };
    fetch('/login',{
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
    });
};