function login()
{
    var name = prompt("Please enter your name:", "");
    var data = {
        id:name,
        name:name,
        picture:'assets/img/people.jpg',
    }
    firebase.database().ref(room+'/player/'+name).update(data).then(function(){
        me = data;
        setCookie('cianjur_poker_user_login', JSON.stringify(data), 365);
        login_status(data);
        firebase.database().ref(room+'/player/'+name).update({
            sync:new Date().getUTCMilliseconds()
        });
    });                        
}
function login_status(data)
{
    if(data.name){
        document.getElementById('status').innerHTML = 'Selamat Datang, ' + data.name + '!';
        $('#btn-login').hide();
    }else{
        document.getElementById('status').innerHTML = 'Silakan login terlebih dahulu.';
        $('#btn-login').show();
    }
}

var user_login = getCookie('cianjur_poker_user_login');
if(user_login){
    login_status(JSON.parse(user_login));
}