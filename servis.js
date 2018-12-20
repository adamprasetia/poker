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
    });
}, 4000)