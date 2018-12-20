var firebase = require("firebase");
var helper = require("./service_helper")

var config = {
    apiKey: "AIzaSyBOXMO2dM5NYeLQIkx4P5c0sL1V7pZPd-E",
    authDomain: "poker-8d4b9.firebaseapp.com",
    databaseURL: "https://poker-8d4b9.firebaseio.com",
};

const room = 'games';
firebase.initializeApp(config);

setInterval(function(){
    firebase.database().ref(room).once('value', function(response){
        const {giliran, player} = response.val()
        if(player[giliran].type == 'bot'){        
            console.log(player[giliran].name,' jalan');
            helper.bot(response);
        }
        var timer = response.val().timer - 10
        if(response.val().timer <= 0){
            helper.setPas(response, response.val().giliran)
            timer = 100
        }
        firebase.database().ref(room).update({
            timer:timer
        });    
    });
}, 4000)

// setInterval(function(){
//     firebase.database().ref(room).once('value', function(response){
//         console.log(response.val().timer);
//         var timer = response.val().timer - 10
//         if(response.val().timer <= 0){
//             helper.setPas(response, response.val().giliran)
//             timer = 100
//         }
//         firebase.database().ref(room).update({
//             timer:timer
//         });    
//     });
// },2000);