function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}     
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}    
function deleteCookie(cname) {
    console.log('deleteCookie: '+cname);
    document.cookie = cname + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
};            
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
}    
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}

function checkReset(player, winner = ''){
    var total = 0;
    var totalSit = 0;
    var totalWinner = 0;
    $.each(player, function(index, value) {
        if (value.card != '[]' && typeof value.card !== 'undefined') {
            total += 1;
        }
        if (value.sitno && value.sitno != 0) {
            totalSit += 1;
        }
        if (value.status == 'winner') {
            totalWinner += 1;
        }
    });
    if (totalSit==1) {
        resetGame();
    }
    if (totalSit > 1 && total == 1) {
        swal("Info", "Bersiap, Permainan Akan Dimulai Kembali" , "info");
        setTimeout(function(){
            resetGame(winner);
        }, 3000);                
    }
    if (totalSit > 1 && total == 0) {
        swal("Info", "Bersiap, Permainan Akan Dimulai" , "info");
        setTimeout(function(){
            resetGame(winner);
        }, 3000);
    }
}
function checkPlayerExist(playername = '') {
    var status = false;
    firebase.database().ref('games/player/'+playername).once('value').then(function(response){
        status = true;
        console.log()
        if (response.val()) {
        }
    });
    return status;
}

function totalPlayer(player){
    var total = 0;
    $.each(player, function(index, value) {
        if (value.sitno && value.sitno != 0) {                            
            total += 1;
        }
    });
    return total;
}            
function resetGame(winner = ''){
    console.log('resetGame', winner);
    firebase.database().ref('games').once('value').then(function(response){
        var config_total_player = totalPlayer(response.val().player);
        var config_total_kartu = 52;
        var kartu = new Array(config_total_kartu);
        for (var i = 0; i < kartu.length; i++) {
            kartu[i] = i;
        }
        kartu = shuffle(kartu);
        var playerCard = new Array(config_total_player);
        for (var i = 0; i < config_total_player; i++) {
            playerCard[i] = [];
        }
        $.each(kartu, function(index, value) {
            playerCard[index % config_total_player].push(value);
        });
        
        var i = 0;
        $.each(response.val().player, function(index, value) {
            if (value.sitno && value.sitno != 0 && totalPlayer(response.val().player) > 1) {                            
                firebase.database().ref('games/player/'+index).update({                 
                    card: JSON.stringify(playerCard[i]),
                    status: 'play'
                });                   
                i++;
            }else{
                firebase.database().ref('games/player/'+index).update({                 
                    card: '[]',
                    status: 0
                });                                               
            }
        });
        
        if (winner == '') {                        
            setGiliran(response.val().player);
        }else{
            setGiliran(response.val().player, winner);
        }
        firebase.database().ref('games').update({
            tablecard:"[]",
            winner:0
        });        
        
    });                
}
function setPlayAll(player){
    $.each(player, function(index, value) {
        if (value.status != 'winner' && value.card != '[]' && typeof value.card !== 'undefined') {
            firebase.database().ref('games/player/'+value.name).update({
                status:'play'
            }).then(function(){
                firebase.database().ref('games').update({
                    tablecard:'[]'
                });
            });
        }
    });
}
function changeGiliran(){
    console.log('changeGiliran');
    firebase.database().ref('games').once('value', function(response) {     

        if (getCountPlay(response.val().player)==0) {    
            console.log('sini');
            firebase.database().ref('games').update({
                giliran:response.val().warisan
            }).then(function(){
                firebase.database().ref('games').update({
                    warisan:0
                });    
                setPlayAll(response.val().player);
            });
        }
        
        var sitno = response.val().player[response.val().giliran].sitno;
        if (sitno == 8) {
            sitno = 1;
        }else{
            sitno++;
        }                
        for (var i = 1; i <= 8; i++) {
            playerBySit = getPlayerBySit(response.val().player, sitno);
            if (playerBySit.status && playerBySit.status == 'play') {
                firebase.database().ref('games').update({
                    giliran:playerBySit.name
                }).then(function(){
                    if (getCountPlay(response.val().player) <= 1) {
                        if (response.val().warisan && response.val().warisan != 0 && typeof response.val().warisan !== 'undefined') {
                            
                        }else{
                            setPlayAll(response.val().player);                                        
                        }
                    }                                                              
                });
                break;
            }
            if (sitno == 8) {
                sitno = 1;
            }else{
                sitno++;
            }
        }
    });
}
function setGiliran(player, winner = ''){
    if (winner == '') {                    
        var sitno = 1;
        for (var i = 1; i <= 8; i++) {
            playerBySit = getPlayerBySit(player, sitno);
            if (parseInt(playerBySit.sitno) == sitno) {
                firebase.database().ref('games').update({
                    giliran:playerBySit.name
                });
                break;
            }
            if (sitno == 8) {
                sitno = 1;
            }else{
                sitno++;
            }
        }
    }else{
        firebase.database().ref('games').update({
            giliran:winner
        });                    
    }
}            

function checkGiliran(){
    if (environment == 'development') {
        return true;
    }else{        
        var status = false;
        firebase.database().ref('games/giliran').once('value', function(response) {
            if (response.val() == me) {
                status = true;
            }
        });
        return status;
    }
    // return true;
}            
function getPlayerBySit(player,sitno){
    var status = false;
    $.each(player, function(index, value) {
        if (parseInt(value.sitno) == sitno) {
            status = value;
            return false;
        }
    });                    
    return status;
}
function getCountPlay(player){
    var total = 0;
    $.each(player, function(index, value) {
        if (value.status == 'play') {
            total += 1;
        }
    });
    return total;
}

function checkSitAvailable(sitno = 0) {
    var status = true;
    firebase.database().ref('games/player').once('value', function(response) {
        if (response.val()) {
            $.each(response.val(), function(index, value) {
                if (parseInt(value.sitno) == sitno) {
                    status = false;
                    return false;
                }
                tablecard += '<img class="card img-thumbnail" src="assets/img/'+value+'.png">';
            });                        
        }
    });
    return status;
}

function checkStraight(cardSelected){
    var cardStraight = [];
    $.each(cardSelected, function(index, value) {
        cardStraight.push((value - (value % 4)) / 4);
    });
    cardStraight.sort(function(a,b){return a-b});
    var a = -1, b = true;
    $.each(cardStraight, function(index, value) {
        if (a == -1) {
            a = value;
        }else{
            if (value-1 == a) {
                a = value;
            }else{
                b = false;
                return false;
            }
        }
    });
    return b;
}
function checkFlush(cardSelected){
    var cardFlush = [];
    var uniqueCardFlush = [];
    $.each(cardSelected, function(index, value) {
        cardFlush.push(value % 4);
    });
    $.each(cardFlush, function(index, value){
        if($.inArray(value, uniqueCardFlush) === -1) uniqueCardFlush.push(value);
    });                
    if (uniqueCardFlush.length == 1) {
        return true;
    }
    return false;
}
function checkFullHouse(cardSelected){
    var cardFullHouse = [];
    var uniqueCardFullHouse = [];
    $.each(cardSelected, function(index, value) {
        cardFullHouse.push((value - (value % 4)) / 4);
    });                
    $.each(cardFullHouse, function(index, value){
        if($.inArray(value, uniqueCardFullHouse) === -1) uniqueCardFullHouse.push(value);
    });
    console.log(uniqueCardFullHouse);
    if (uniqueCardFullHouse.length == 2) {
        var a = uniqueCardFullHouse[0];
        var b = uniqueCardFullHouse[1];
        var aa = 0;
        var bb = 0;
        var big = 0;
        $.each(cardFullHouse, function(index, value){
            if (a == value) {
                aa += 1; 
            }
            if (b == value) {
                bb += 1;
            } 
        });
        if ((aa == 3 && bb == 2) || (aa == 2 && bb == 3)) {
            if (aa > bb) {
                big = a;
            }else{
                big = b;
            }
            return {'big':big, 'status':true};
        }
        return {'big':big, 'status':false};
    }else{
        return {'big':big, 'status':false};
    }               
}
function validasi(cardSelected, card_on_arena){
    // validasi jumlah kartu
    if (cardSelected.length != card_on_arena.length && card_on_arena.length != 0 && cardSelected.length != 4 && card_on_arena[0] != 51 && card_on_arena[0] != 50 && card_on_arena[0] != 49 && card_on_arena[0] != 48) {
        return false;
    }
    
    // validasi single
    if (cardSelected.length == 1 && cardSelected[0] < card_on_arena[0]) {
        return false;
    }
    // validasi pair
    if (cardSelected.length > 1 && cardSelected.length < 5) {
        var valid = true;
        $.each(cardSelected, function(index, value) {
            if (((value-(value%4))/4) != ((cardSelected[0]-(cardSelected[0]%4))/4)) {
                valid = false;
                return false;
            }                   
        });
        console.log('valid',valid);
        if (!valid) {
            return false;
        }
        if (cardSelected.length == 4 && card_on_arena.length == 1 && (card_on_arena[0] == 51 || card_on_arena[0] == 50 || card_on_arena[0] == 49 || card_on_arena[0] == 48)) {
            return true;
        }
        if (Math.max(...cardSelected) < Math.max(...card_on_arena)) {
            return false;
        }
    }
    // validasi 5 card
    if (cardSelected.length == 5) {
        if (checkFullHouse(cardSelected).status) {
            console.log('full house');                        
            if (card_on_arena.length != 0) {
                if (checkFullHouse(card_on_arena).status) {
                    console.log(checkFullHouse(cardSelected).big, checkFullHouse(card_on_arena).big);
                    if (checkFullHouse(cardSelected).big < checkFullHouse(card_on_arena).big) {
                        return false;
                    }
                }else{
                    return false;
                }
            }
        }else if (checkFlush(cardSelected) && checkStraight(cardSelected)) {
            console.log('straight flush');
            if (card_on_arena.length != 0) {
                if ((checkFlush(card_on_arena) && checkStraight(card_on_arena)) || checkStraight(card_on_arena) || checkFlush(card_on_arena)) {
                    if (Math.max(...cardSelected) < Math.max(...card_on_arena)) {
                        return false;
                    }                                
                }else{
                    return false;
                }
            }
        }else if (checkFlush(cardSelected)) {
            console.log('flush');    
            if (card_on_arena.length != 0) {                            
                if (checkFlush(card_on_arena) && !checkStraight(card_on_arena)) {
                    if (Math.max(...cardSelected) < Math.max(...card_on_arena)) {
                        return false;
                    }                                
                }else{
                    return false;
                }
            }                    
        }else if (checkStraight(cardSelected)) {                        
            console.log('straight');
            if (card_on_arena.length != 0) {                            
                if (checkStraight(card_on_arena) && !checkFlush(card_on_arena)) {
                    if (Math.max(...cardSelected) < Math.max(...card_on_arena)) {
                        return false;
                    }                                
                }else{
                    return false;
                }
            }
        }else{
            console.log('not match');
            return false;
        }
    }
    
    return true;
}
function setWarisan(winner){
    console.log('setWarisan');
    firebase.database().ref('games').once('value', function(response) {                                    
        var sitno = response.val().player[winner].sitno;
        if (sitno == 8) {
            sitno = 1;
        }else{
            sitno++;
        }                
        for (var i = 1; i <= 8; i++) {
            playerBySit = getPlayerBySit(response.val().player, sitno);
            if (playerBySit.status && playerBySit.status != 'winner') {
                firebase.database().ref('games').update({
                    warisan:playerBySit.name
                });
                break;
            }
            if (sitno == 8) {
                sitno = 1;
            }else{
                sitno++;
            }
        }
    });
}
