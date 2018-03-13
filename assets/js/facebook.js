function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    if (response.status === 'connected') {
        testAPI();
    } else {
        document.getElementById('status').innerHTML = 'Please log into this app.';
    }
}
function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId      : '2107385236164859', // development
        // appId      : '2100687543493680', // production
        cookie     : true,
        xfbml      : true,
        version    : 'v2.8'
    });
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
};

// Load the SDK asynchronously
(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = "https://connect.facebook.net/en_US/sdk.js";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', {fields: "id,name,picture"}, function(response) {
        me = response;
        firebase.database().ref(room+'/player/'+response.id).update({
            id:response.id,
            name:response.name,
            picture:response.picture.data.url,
            sync:new Date().getUTCMilliseconds()
        });                        
        
        console.log('me',response);
        console.log('Successful login for: ' + response.name);
        document.getElementById('status').innerHTML = 'Thanks for logging in, ' + response.name + '!';
    });
}