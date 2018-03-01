firebase.initializeApp({
    apiKey: "AIzaSyAYdUEY6XNoHcOW0TomdhxcxVLfvLQumoM",
    authDomain: "adamprasetia-a40df.firebaseapp.com",
    databaseURL: "https://adamprasetia-a40df.firebaseio.com",
    projectId: "adamprasetia-a40df",
    storageBucket: "adamprasetia-a40df.appspot.com",
    messagingSenderId: "188288474340"
});
var config_total_kartu = 2;
var config_total_player = parseInt($('#txtTotalPlayer').val());
var config_total_kartu_player = parseInt(config_total_kartu/config_total_player);