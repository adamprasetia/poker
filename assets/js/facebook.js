function statusChangeCallback(response) {
    if (response.status === 'connected') {
        console.log('Welcome!  Fetching your information.... ');
        FB.api('/me', {fields: "id,name,picture"}, function(response) {
            console.log('connected', response)
            if (response && response.id && typeof response.id !== 'undefined') {                
                firebase.database().ref(room+'/player/'+response.id).update({
                    id:response.id,
                    name:response.name,
                    picture:response.picture.data.url,
                }).then(function(){
                    me = response;
                    console.log('me', me)
                    firebase.database().ref(room+'/player/'+response.id).update({
                        sync:new Date().getUTCMilliseconds()
                    });
                });                        
                $('#fb-login').hide();
                document.getElementById('status').innerHTML = 'Selamat Datang, ' + response.name + '!';
            }
        });        
    } else {
        document.getElementById('status').innerHTML = 'Silakan login terlebih dahulu.';
    }
}

function checkLoginState() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId      : '538862216589128',
        cookie     : true,  // enable cookies to allow the server to access 
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.8' // use graph api version 2.8
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