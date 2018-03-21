function statusChangeCallback(response) {
    if (response.status === 'connected') {
        FB.api('/me', {fields: "id,name,picture"}, function(response) {
            me = response;
            firebase.database().ref(room+'/player/'+response.id).update({
                id:response.id,
                name:response.name,
                picture:response.picture.data.url,
                sync:new Date().getUTCMilliseconds()
            });                        
            $('#fb-login').hide();
            document.getElementById('status').innerHTML = 'Selamat Datang, ' + response.name + '!';
        });        
    } else {
        document.getElementById('status').innerHTML = 'Silakan login terlebih dahulu.';
    }
}

function checkLoginState(event) {
    console.log('checkLoginState');
  if (event.authResponse) {
      console.log('sini');
    // User is signed-in Facebook.
    var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
      unsubscribe();
        // Build Firebase credential with the Facebook auth token.
        var credential = firebase.auth.FacebookAuthProvider.credential(
            event.authResponse.accessToken);
        // Sign in with the credential from the Facebook user.
        firebase.auth().signInWithCredential(credential).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
          console.log('error nih', errorCode, errorMessage);
        });
    });
  } else {
      console.log('sono');
    // User is signed-out of Facebook.
    firebase.auth().signOut();
  }
}
window.fbAsyncInit = function() {
    FB.init({
        // appId      : '2107385236164859', // development
        appId      : '2100687543493680', // production
        cookie     : true,
        xfbml      : true,
        version    : 'v2.8'
    });
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
    FB.Event.subscribe('auth.authResponseChange', checkLoginState);
};

// Load the SDK asynchronously
(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = "https://connect.facebook.net/en_US/sdk.js";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));