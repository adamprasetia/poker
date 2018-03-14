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

function setLoser(player){
    $.each(player, function(index, value) {
        if (value.card != '[]' && (value.status == 'play' || value.status == 'pas')) {
            firebase.database().ref(room).update({                 
                loser: value.id
            });
        }
    });
}
function checkReset(){
    console.log('checkReset');
    firebase.database().ref(room).once('value').then(function(response){        
        var player = response.val().player;
        var winner = response.val().winner;
        var totalPlayerCard = 0;
        var totalPlayerSit = 0;
        $.each(player, function(index, value) {
            if (value.card != '[]' && typeof value.card !== 'undefined') {
                totalPlayerCard += 1;
            }
            if (value.sitno && value.sitno != 0) {
                totalPlayerSit += 1;
            }
        });
        if (totalPlayerSit == 1 || (totalPlayerSit > 1 && totalPlayerCard <= 1)) {
            if (totalPlayerSit > 1) {                
                setLoser(player);
            }
            resetGame(player, winner);
        }
    });    
}
function checkPlayerExist(playername = '') {
    var status = false;
    firebase.database().ref(room+'/player/'+playername).once('value').then(function(response){
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
function resetGame(player = [], winner = ''){
    console.log('resetGame', winner);
    var config_total_player = totalPlayer(player);
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
    $.each(player, function(index, value) {
        if (value.sitno && value.sitno != 0 && config_total_player > 1) {                            
            firebase.database().ref(room+'/player/'+index).update({                 
                card: JSON.stringify(playerCard[i]),
                status: 'play'
            });                   
            i++;
        }else{
            firebase.database().ref(room+'/player/'+index).update({                 
                card: '[]',
                status: 'waiting'
            });                                               
        }
    });
    
    if (winner == '') {                        
        setGiliran(player);
    }else{
        setGiliran(player, winner);
    }
    firebase.database().ref(room).update({
        tablecard:"[]",
        tablecardplayer:0,
        winner:0,
        bom:0
    }).then(function(){
        timeout = 100;
    });                                                        
}
function setPlayAll(player, bom){
    if (bom && typeof bom !== 'undefined' && bom != 0) {
        firebase.database().ref(room).once('value', function(response) {   
            if (response.val().winner != 0) {                
                resetGame(player, response.val().winner);
            }else{                
                resetGame(player, bom);
            }
        });
    }
    $.each(player, function(index, value) {
        if (value.status != 'winner' && value.card != '[]' && typeof value.card !== 'undefined') {
            firebase.database().ref(room+'/player/'+value.id).update({
                status:'play'
            }).then(function(){
                firebase.database().ref(room).update({
                    tablecard:'[]',
                    tablecardplayer:0
                });
            });
        }
    });
}
function changeGiliran(callback){
    firebase.database().ref(room).once('value', function(response) {     
        if (response.val() && response.val().giliran) {            
            if (getCountPlay(response.val().player)==0) {    
                firebase.database().ref(room).update({
                    giliran:response.val().warisan
                }).then(function(){
                    firebase.database().ref(room).update({
                        warisan:0
                    });    
                    setPlayAll(response.val().player, response.val().bom);
                });
            }
            var sitno = parseInt(response.val().player[response.val().giliran].sitno);
            if (sitno == 10) {
                sitno = 1;
            }else{
                sitno++;
            }                
            for (var i = 1; i <= 10; i++) {
                playerBySit = getPlayerBySit(response.val().player, sitno);
                if (playerBySit.status && playerBySit.status == 'play') {
                    firebase.database().ref(room).update({
                        giliran:playerBySit.id
                    }).then(function(){
                        if (getCountPlay(response.val().player) <= 1) {
                            if (response.val().warisan && response.val().warisan != 0 && typeof response.val().warisan !== 'undefined') {
                                
                            }else{
                                setPlayAll(response.val().player, response.val().bom);
                            }
                        }      
                    });
                    break;
                }
                if (sitno == 10) {
                    sitno = 1;
                }else{
                    sitno++;
                }
            }
            timeout = 100;
        }
    }).then(function(){        
        callback();
    });
}
function getSitNoByPlayer(players, player){
    var status = false;
    $.each(players, function(index, value) {
        if (value.id == player) {
            status = value.sitno;
            return false;
        }
    });
    return status;
}
function setGiliran(player, winner = ''){
    if (winner != '' && getSitNoByPlayer(player, winner) != false) {                    
        firebase.database().ref(room).update({
            giliran:winner
        });                    
    }else{
        var sitno = Math.floor((Math.random() * 10) + 1);
        for (var i = 1; i <= 10; i++) {
            playerBySit = getPlayerBySit(player, sitno);
            if (parseInt(playerBySit.sitno) == sitno) {
                firebase.database().ref(room).update({
                    giliran:playerBySit.id
                });
                break;
            }
            if (sitno == 10) {
                sitno = 1;
            }else{
                sitno++;
            }
        }
    }
}            

function checkGiliran(){
    var status = false;
    firebase.database().ref(room+'/giliran').once('value', function(response) {
        if (response.val() == me.id) {
            status = true;
        }
    });
    return status;
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
    firebase.database().ref(room+'/player').once('value', function(response) {
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
    if (cardSelected.length != 5) {
        return false;
    }
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
    if (cardSelected.length != 5) {
        return false;
    }    
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
    if (cardSelected.length < 1 || cardSelected.length > 5) {
        return false;
    }
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
        if (!valid) {
            return false;
        }
        if (cardSelected.length == 4 && card_on_arena.length == 1 && card_on_arena[0] >= 48) {
            firebase.database().ref(room).update({
                bom:me.id
            });
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
                if (checkStraight(card_on_arena) || checkFlush(card_on_arena)) {
                    if (Math.max(...cardSelected) < Math.max(...card_on_arena)) {
                        return false;
                    }                                
                }else if(card_on_arena[0] >= 48 && card_on_arena.length == 1){
                    firebase.database().ref(room).update({
                        bom:me.id
                    });
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
    firebase.database().ref(room).once('value', function(response) {                                    
        var sitno = response.val().player[winner].sitno;
        if (sitno == 10) {
            sitno = 1;
        }else{
            sitno++;
        }                
        for (var i = 1; i <= 10; i++) {
            playerBySit = getPlayerBySit(response.val().player, sitno);
            if (playerBySit.status && playerBySit.status != 'winner' && playerBySit.status != 'waiting') {
                firebase.database().ref(room).update({
                    warisan:playerBySit.id
                });
                break;
            }
            if (sitno == 10) {
                sitno = 1;
            }else{
                sitno++;
            }
        }
    });
}
function tes(callback){
    console.log('tes 1');
    console.log('tes 2');
    console.log('tes 3');
    callback();
}
function kickPlayer(player = 0){           
    firebase.database().ref(room).once('value', function(response) {
        var giliran = response.val().giliran;
        if (player != 0) {
            giliran = player;
        }
        firebase.database().ref(room+'/player/'+giliran).update({
            card:'[]',
            status:0,
            sitno:0
        }).then(function(){
            if (response.val().giliran == giliran) {                    
                changeGiliran(function(){
                    checkReset();
                });
            }
        });
    });
} 
function setLoserByBom(player, bom, callback){
    if (getCountPlay(player)==2 && bom != 0) {    
        firebase.database().ref(room).update({
            loser: me.id
        });
    }    
    callback(player, bom);
}
function bot(){
    firebase.database().ref(room).once('value', function(response) {        
        if (response.val() && response.val().tablecard) {            
            var tablecard = JSON.parse(response.val().tablecard);
            var playergiliran = response.val().player[response.val().giliran];
            var botcard = JSON.parse(playergiliran.card);
            var botselected = [];
            if (playergiliran.status == 'play' && playergiliran.type == 'bot' && response.val().tablecardplayer != playergiliran.id) {            
                if (tablecard.length == 0) {      
                    botselected.push(botcard.sort(function(a, b){return a - b})[0]);
                    sendCard(botselected, function(){});
                }else if (tablecard.length == 1) {            
                    $.each(botcard.sort(function(a, b){return a - b}), function(indexCard, valueCard) {
                        if (valueCard > tablecard[0]) {
                            botselected.push(valueCard);
                            sendCard(botselected, function(){});
                            return false;
                        }
                    });
                    if (botselected.length == 0) {
                        firebase.database().ref(room+'/player/'+response.val().giliran).update({
                            status: 'pas'
                        }).then(function(){                      
                            changeGiliran(function(){});
                        });                
                    }
                }else if (tablecard.length > 1 && tablecard.length < 5) { 
                    var tablecardindex = (tablecard[0]-(tablecard[0]%4))/4;
                    var pair;
                    $.each(botcard.sort(function(a, b){return a - b}), function(index, value) {
                        pair = [];
                        var total = 0;
                        $.each(botcard.sort(function(a, b){return a - b}), function(indexs, values) {
                            if ((value-(value%4))/4==(values-(values%4))/4 && (values-(values%4))/4 > tablecardindex) {
                                if (total < tablecard.length) {                                    
                                    pair.push(values);
                                }
                                total++;
                            }
                        });
                        if (total == tablecard.length) {
                            return false;
                        }
                    });
                    if (pair.length == tablecard.length) {                        
                        sendCard(pair);
                    }else{
                        firebase.database().ref(room+'/player/'+response.val().giliran).update({
                            status: 'pas'
                        }).then(function(){                      
                            changeGiliran(function(){});
                        });                                        
                    }
                }else{     
                    firebase.database().ref(room+'/player/'+response.val().giliran).update({
                        status: 'pas'
                    }).then(function(){                      
                        changeGiliran(function(){});
                    });                
                }                    
            }
        }
    });
}
function sendCard(cardSelected, callback)
{
    firebase.database().ref(room).once('value', function(response) {
        var giliran = response.val().giliran;
        var playerCard = JSON.parse(response.val().player[giliran].card)
        firebase.database().ref(room).update({
            tablecard:JSON.stringify(cardSelected),
            tablecardplayer:response.val().player[giliran].id
        }).then(function(){
            $.each(cardSelected, function(index, value) {
                remove(playerCard, value);
            });
            firebase.database().ref(room+'/player/'+giliran).update({
                card:JSON.stringify(playerCard)
            }).then(function(){   
                if (response.val().warisan && response.val().warisan != 0 && typeof response.val().warisan != 'undefined') {
                    firebase.database().ref(room).update({
                        warisan:0
                    });      
                }
                if (playerCard.length == 0) {
                    firebase.database().ref(room+'/player/'+giliran).update({
                        status:'winner'
                    }).then(function(){
                        setWarisan(giliran);
                        if (response.val().winner == 0 || typeof response.val().winner === 'undefined') {
                            firebase.database().ref(room).update({
                                winner:giliran,
                                juara:giliran
                            }).then(function(){
                                checkReset();
                            });
                        }else{
                            checkReset();                                                
                        }
                    });
                }
                changeGiliran(function(){});
            });                    
        });                    
    }).then(function(){
        callback(cardSelected);
    });                    
}