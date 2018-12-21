var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyBOXMO2dM5NYeLQIkx4P5c0sL1V7pZPd-E",
    authDomain: "poker-8d4b9.firebaseapp.com",
    databaseURL: "https://poker-8d4b9.firebaseio.com",
};

firebase.initializeApp(config);

firebase.database().ref('games/player').once('value', function(response){
    var player = response.val();
    var players = []
    Object.values(player).map(function(value){
        if(value.totaljuara){
            players.push({name:value.name, total:value.totaljuara})
        }
    });
    players = players.sort(function(a,b){return b.total - a.total})
    console.log(players);
});
