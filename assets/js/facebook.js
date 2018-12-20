window.fbAsyncInit = function() {
    FB.init({
        // appId      : '2107385236164859', // development
        // appId      : '2100687543493680', // production
        appId      : '538862216589128',
        cookie     : true,
        xfbml      : true,
        version    : 'v2.8'
    });
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
    
    // FB.Event.subscribe('auth.authResponseChange', checkLoginState);
}
  
function checkLoginState(event) {
  if (event.authResponse) {
    // User is signed-in Facebook.
    var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
      unsubscribe();
      // Check if we are already signed-in Firebase with the correct user.
      if (!isUserEqual(event.authResponse, firebaseUser)) {
        // Build Firebase credential with the Facebook auth token.
        var credential = firebase.auth.FacebookAuthProvider.credential(event.authResponse.accessToken);
        // Sign in with the credential from the Facebook user.
        firebase.auth().signInWithCredential(credential).then(function(){
            FB.getLoginStatus(function(response) {
                statusChangeCallback(response);
            });            
        }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...          
        });
      } else {
        // User is already signed-in Firebase with the correct user.
      }
    });
  } else {
    // User is signed-out of Facebook.
    firebase.auth().signOut();
  }
}

function isUserEqual(facebookAuthResponse, firebaseUser) {
  if (firebaseUser) {
    var providerData = firebaseUser.providerData;
    for (var i = 0; i < providerData.length; i++) {
      if (providerData[i].providerId === firebase.auth.FacebookAuthProvider.PROVIDER_ID &&
          providerData[i].uid === facebookAuthResponse.userID) {
        // We don't need to re-auth the Firebase connection.
        return true;
      }
    }
  }
  return false;
}

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        FB.api('/me', {fields: "id,name,picture"}, function(response) {
            if (response && response.id && typeof response.id !== 'undefined') {                
                firebase.database().ref(room+'/player/'+response.id).update({
                    id:response.id,
                    name:response.name,
                    picture:response.picture.data.url,
                }).then(function(){
                    me = response;
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
