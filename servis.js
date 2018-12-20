var firebase = require("firebase");
var helper = require("./service_helper")

var config = {
    apiKey: "AIzaSyBOXMO2dM5NYeLQIkx4P5c0sL1V7pZPd-E",
    authDomain: "poker-8d4b9.firebaseapp.com",
    databaseURL: "https://poker-8d4b9.firebaseio.com",
};

firebase.initializeApp(config);

setInterval(function(){
    firebase.database().ref('games').once('value', function(response){
        const {giliran, player} = response.val()
        if(player[giliran].type == 'bot'){        
            console.log(player[giliran].name,' jalan');
            helper.bot(response);
        }
    });
}, 2000)

// firebase.database().ref('games').update({
//     timer:100
// });

// setInterval(function(){
//     helper.bot()
    // firebase.database().ref('games/timer').once('value').then(function(response){        
    //     console.log(response.val());
    //     firebase.database().ref('games').update({
    //         timer:response.val() - 1
    //     });        
    // });
// }, 1000)
// firebase.database().ref('games').once('value').then(function(response){        
//     console.log(response.val());
// });

// firebase.database().ref('games/chat').update({
//     message:'hihi',
//     from:'adam'
// }).then(function(){                    
//     // $('#input-chat').val('');
// });                                                                
