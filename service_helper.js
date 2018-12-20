var firebase = require("firebase");

const room = 'games'

function getPlayerSitNo(players, sitNo){
    var player = false;
    Object.values(players).map(value => {
        if (value.sitno == sitNo) {
            player = value;
            return false;
        }
    });
    return player;
}
function setPas(response, playerId, callBack = function(){}){
    console.log(response.val().player[playerId].name,'PAS')
    var players = response.val().player;
    var bom = response.val().bom;
    var giliran = response.val().giliran;
    firebase.database().ref(room+'/player/'+playerId).update({
        status: 'pas'
    }).then(function(){          
        setLoserByBom(response, function(){
            changeGiliran(response, giliran, function(){
                checkReset(response);
            });                    
        });                    
    });
    callBack(response, playerId, callBack);
}
function getTotalPlayer(player){
    var total = 0;
    Object.values(player).map(value => {
        if (value.sitno != 0 && typeof value.sitno !== 'undefined') {
            total++;
        }
    });
    return total;
}
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
}    
function getSitByPlayer(players, player){
    var status = false;
    Object.values(players).map(value => {
        if (value.id == player) {
            status = value.sitno;
            return false;
        }
    });
    return status;
}
function getPlayerBySit(player,sitno){
    var status = false;
    Object.values(player).map(value => {
        if (parseInt(value.sitno) == sitno) {
            status = value;
            return false;
        }
    });                    
    return status;
}
function setGiliran(response){
    if (response) {         
        var bom = response.bom;
        var winner = response.winner;            
        var players = response.player;
        if (typeof winner != 'undefined' && winner != '' && getSitByPlayer(players, winner) != false) {
            return winner;
        }else if (typeof bom != 'undefined' && bom != '' && getSitByPlayer(players, bom) != false) {
            return bom;            
        }else{
            var sitno = Math.floor((Math.random() * 10) + 1);
            for (var i = 1; i <= 10; i++) {
                player = getPlayerBySit(players, sitno);
                if (parseInt(player.sitno) == sitno) {
                    return player.id;
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
}            

function setLoser(players, callBack){
    Object.values(players).map(value => {
        if (value.card != '[]' && value.id && (value.status == 'main' || value.status == 'pas')) {
            firebase.database().ref(room).update({                 
                loser: value.id
            });
        }
    });
    callBack(players);
}

function checkReset(response){
    console.log('check reset')
    firebase.database().ref(room).once('value', function(response){
        var players = response.val().player;
        var totalPlayerCard = 0;
        var totalPlayerSit = 0;
        Object.values(players).map(value => {
            if (value.card != '[]' && typeof value.card !== 'undefined' && value.id) {
                totalPlayerCard += 1;
            }
            if (value.sitno && value.sitno != 0) {
                totalPlayerSit += 1;
            }
        });
        if (totalPlayerSit == 1 || (totalPlayerSit > 1 && totalPlayerCard <= 1)) {
            if (totalPlayerSit > 1) {
                setLoser(players, function(){                    
                    resetGame(response);
                });                
            }else{                
                resetGame(response);
            }
        }
    });
}

function resetGame(response){
    var winner = response.val().winner;
    var bom = response.val().bom;
    var juara = 0;
    if (winner != 0 && typeof winner != 'undefined') {
        juara = winner;
    }
    if (bom != 0 && typeof bom != 'undefined' && (winner == 0 || typeof winner == 'undefined')) {
        juara = bom;
    }
    
    // count juara
    if (juara != 0) {            
        var totalJuara = 0;
        if (typeof response.val().player[juara].totaljuara != 'undefined') {
            totalJuara = parseInt(response.val().player[juara].totaljuara);
        }
        firebase.database().ref(room+'/player/'+juara).update({
            totaljuara: totalJuara+1
        });
    }
    
    var player = response.val().player;
    var totalPlayer = getTotalPlayer(player);
    var totalCard = 52;
    var card = new Array(totalCard);
    for (var i = 0; i < card.length; i++) {
        card[i] = i;
    }
    card = shuffle(card);
    var playerCard = new Array(totalPlayer);
    for (var i = 0; i < totalPlayer; i++) {
        playerCard[i] = [];
    }
    card.map((value, index) => {
        playerCard[index % totalPlayer].push(value);
    });
    var i = 0;
    Object.values(player).map(value => {
        console.log('reset', value.name)
        if (value.sitno && value.sitno != 0 && typeof value.sitno !== 'undefined' && totalPlayer > 1) {
            firebase.database().ref(room+'/player/'+value.id).update({
                card: JSON.stringify(playerCard[i]),
                status: 'main'
            });
            i++;
        }
    });
    var giliran = setGiliran(response.val());
    firebase.database().ref(room).update({
        giliran: giliran,
        winner:0,
        bom:0,
        tablecard:'[]',
        tablecardplayer:0,
        warisan:0,
        juara:juara
    });
}
function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}
function setWarisan(response, callBack){
    var giliran = response.val().giliran;
    var players = response.val().player;
    var sitno = response.val().player[giliran].sitno;
    if (sitno == 10) {
        sitno = 1;
    }else{
        sitno++;
    }                
    for (var i = 1; i <= 10; i++) {
        player = getPlayerBySit(players, sitno);
        if (player.status && player.status != 'menang' && player.status != 'menunggu' && player.status != 'pas') {
            firebase.database().ref(room).update({
                warisan:player.id
            });
            break;
        }
        if (sitno == 10) {
            sitno = 1;
        }else{
            sitno++;
        }
    }
    callBack(response);
}

function sendCard(response, cardSelected, callBack = function(){}){
    var giliran = response.val().giliran;
    var bom = response.val().bom;
    if (bom !== 0 && typeof bom !== 'undefined') {
        firebase.database().ref(room).update({
            bom:giliran
        });
    }
    var playerCard = JSON.parse(response.val().player[giliran].card);  
    firebase.database().ref(room).update({
        tablecard:JSON.stringify(cardSelected),
        tablecardplayer:response.val().player[giliran].id
    }).then(function(){
        firebase.database().ref(room).update({
            warisan:0
        }).then(function(){                
            cardSelected.map(value => {
                remove(playerCard, value);
            });            
            firebase.database().ref(room+'/player/'+giliran).update({
                card:JSON.stringify(playerCard)
            }).then(function(){   
                if (playerCard.length == 0) {
                    firebase.database().ref(room+'/player/'+giliran).update({
                        status:'menang'
                    }).then(function(){
                        setWarisan(response, function(){
                            if (response.val().winner == 0 || typeof response.val().winner === 'undefined') {
                                firebase.database().ref(room).update({
                                    winner:giliran,
                                    juara:giliran
                                }).then(function(){
                                    changeGiliran(response, giliran, function(){
                                        checkReset(response);
                                    });                                                
                                });
                            }else{
                                changeGiliran(response, giliran, function(){
                                    checkReset(response);
                                });
                            }
                        });
                    });
                }else{
                    changeGiliran(response, giliran, function(){
                        checkReset(response);
                    });
                }
            });
        });
        callBack(response, cardSelected);
    });
}
function changeGiliran(response, giliran = 0, callBack = function(){}){
    console.log('changeGiliran')
    firebase.database().ref(room).update({
        timer:100
    });    
    firebase.database().ref(room).once('value', function(response){
        if (giliran == 0) {            
            giliran = response.val().giliran;
        }
        var players = response.val().player;
        var warisan = response.val().warisan;

        if(getCountPlay(players)==0){
            if(warisan != 0){
                firebase.database().ref(room).update({
                    giliran:warisan
                }).then(function(){
                    firebase.database().ref(room).update({
                        warisan:0
                    });    
                    setPlayAll(response, players);
                });        
            }
            setPlayAll(response, players);
        }else{
            var sitno = getSitByPlayer(players, giliran);
            if (sitno == 10) {
                sitno = 1;
            }else{
                sitno++;
            }
            for (var i = 1; i <= 10; i++) {
                var player = getPlayerBySit(players, sitno);        
                if (player.status == 'main') {
                    firebase.database().ref(room).update({
                        giliran:player.id
                    }).then(function(){
                        if(getCountPlay(players)<=1 && (warisan == player.id || warisan == 0)){
                            setPlayAll(response, players);
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
        }
    }).then(function(){
        callBack(response, giliran);
    })
}
function setPlayAll(response, players){
    var bom = response.val().bom;
    var winner = response.val().winner;
    if (bom && typeof bom !== 'undefined' && bom != 0) {
        if (winner != 0 && typeof winner !== 'undefined') {                
            firebase.database().ref(room).update({
                winner:bom,
                juara:bom
            }).then(function(){
                resetGame(response);
            });
        }else{                
            resetGame(response);
        }
    }    
    Object.values(players).map(value => {
        if (value.status == 'pas') {
            firebase.database().ref(room+'/player/'+value.id).update({
                status:'main'
            }).then(function(){
                firebase.database().ref(room).update({
                    tablecard:'[]',
                    tablecardplayer:0,
                    warisan:0
                });                
            });            
        }
    });
}
function getCountPlay(players){
    var total = 0;
    Object.values(players).map(value => {
        if (value.status == 'main' && typeof value.id !== 'undefined' && typeof getSitByPlayer(players, value.id) !== 'undefined') {
            total += 1;
        }
    });
    return total;
}
function checkStraight(cardSelected){
    if (cardSelected.length != 5) {
        return false;
    }
    var cardStraight = [];
    cardSelected.map(value => {
        cardStraight.push((value - (value % 4)) / 4);
    });
    cardStraight.sort(function(a,b){return a-b});
    var a = -1, b = true;
    cardStraight.map(value => {
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
    cardSelected.map(value => {
        cardFlush.push(value % 4);
    });
    cardFlush.map(value => {
        // if($.inArray(value, uniqueCardFlush) === -1) uniqueCardFlush.push(value);
        if(uniqueCardFlush.indexOf(value) === -1) uniqueCardFlush.push(value);
    });                
    if (uniqueCardFlush.length == 1) {
        return true;
    }
    return false;
}
function checkFullHouse(cardSelected){
    var cardFullHouse = [];
    var uniqueCardFullHouse = [];
    cardSelected.map(value => {
        cardFullHouse.push((value - (value % 4)) / 4);
    });                
    cardFullHouse.map(value => {
        // if($.inArray(value, uniqueCardFullHouse) === -1) uniqueCardFullHouse.push(value);
        if(uniqueCardFullHouse.indexOf(value) === -1) uniqueCardFullHouse.push(value);
    });
    if (uniqueCardFullHouse.length == 2) {
        var a = uniqueCardFullHouse[0];
        var b = uniqueCardFullHouse[1];
        var aa = 0;
        var bb = 0;
        var big = 0;
        cardFullHouse.map(value => {
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
        cardSelected.map(value => {
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
            if (card_on_arena.length != 0) {
                if (checkFullHouse(card_on_arena).status) {
                    if (checkFullHouse(cardSelected).big < checkFullHouse(card_on_arena).big) {
                        return false;
                    }
                }else{
                    return false;
                }
            }
        }else if (checkFlush(cardSelected) && checkStraight(cardSelected)) {
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
            return false;
        }
    }
    
    return true;
}
function setLoserByBom(response, callBack){
    var players = response.val().player;
    var giliran = response.val().giliran;
    var bom = response.val().bom;
    if (getCountPlay(players)==1 && bom !== 0 && typeof bom !== 'undefined') {    
        firebase.database().ref(room).update({
            loser: giliran                
        });
    }    
    callBack(response);
}
function botPair(card, tablecard = 0, count = 0){
    var card = card.sort(function(a, b){return a - b});
    var selected, total, status;
    status = false;
    card.map(value => {
        if(status == true){
            return true;
        }else{
            selected = [];
        }
        total = 0;
        card.map(values => {
            if ((value-(value%4))/4 == (values-(values%4))/4) {
                selected.push(values);
                total++;
            }                        
        });                    
        if (tablecard !== 0) {
            if (total == tablecard.length) {
                if (Math.max.apply(Math, selected) > Math.max.apply(Math, tablecard)) {
                    status = true;
                }
            }
        }else{          
            if (count !== 0) {
                if (total == count) {
                    status = true;
                }
            }else{                            
                status = true;    
            }
        }
    });
    if (status) {
        console.log('botpair', selected);
        return selected;
    }else{
        return false;
    }
}
function botPairPecah(card, tablecard = 0){
    var card = card.sort(function(a, b){return a - b});
    var selected, total, status;
    status = false;
    card.map(value => {
        if(status == true){
            return true;
        }else{
            selected = [];
        }
        total = 0;
        if (value >= 32) {            
            card.map(values => {
                if(status == true){
                    return true;
                }                
                if ((value-(value%4))/4 == (values-(values%4))/4) {
                    selected.push(values);
                    total++;
                }                        
            });                    
            if (tablecard !== 0) {
                if (total == tablecard.length) {
                    if (Math.max.apply(Math, selected) > Math.max.apply(Math, tablecard)) {
                        status = true;
                    }
                }
            }
        }
    });
    if (status) {
        console.log('bot pair pecah', selected);
        return selected;
    }else{
        return false;
    }
}
function botMinMatch5(card, tablecard = 0){
    var matchtype;
    if (checkFullHouse(tablecard).status) {
        matchtype = 'fh';
    }else if (checkFlush(tablecard) && checkStraight(tablecard)) {
        matchtype = 'sf';
    }else if (checkFlush(tablecard)) {
        matchtype = 'f';
    }else if (checkStraight(tablecard)) {                        
        matchtype = 's';
    }
    
    var card = card.sort(function(a, b){return a - b});
    var selected, total, status;
    status = false;
    card.map(value => {
        if(status == true){
            return true;
        }else{
            selected = [];
        }        
        selected.push(value);
        total = 1;
        card.map(values => {
            if(status == true){
                return true;
            }            
            if (value != values) {                            
                if (matchtype == 'fh') {
                    if ((value-(value%4))/4 == (values-(values%4))/4) {
                        selected.push(values);
                        total++;
                    }                                                        
                }else if (matchtype == 'sf') {
                    if ((selected[selected.length-1]%4 == values%4) && (((selected[selected.length-1]-(selected[selected.length-1]%4))/4)+1 == (values-(values%4))/4)) {
                        selected.push(values);
                        total++;                                
                    }
                }else if (matchtype == 'f') {
                    if (selected[selected.length-1]%4 == values%4) {
                        selected.push(values);
                        total++;
                    }                                                                         
                }else if (matchtype == 's') {
                    if (((selected[selected.length-1]-(selected[selected.length-1]%4))/4)+1 == (values-(values%4))/4) {
                        selected.push(values);
                        total++;
                    }                                             
                }
            }
            if (total == tablecard.length) {
                status = true;
            }       
        });      
        if (matchtype == 'fh') {                        
            if (total == 3) {
                var child = botPair(card, 0, 2);
                if (child) {
                    child.map(valueChild => {
                        selected.push(valueChild);
                    });
                }
                if (checkFullHouse(selected).big > checkFullHouse(tablecard).big) {                                
                    status = true;
                }
            }
        }else{
            if (tablecard !== 0) {
                if (total == tablecard.length) {
                    if (Math.max.apply(Math, selected) > Math.max.apply(Math, tablecard)) {
                        status = true;
                    }
                }
            }else{                    
                status = true;    
            }
        }         
    });
    if (status) {
        return selected;
    }else{
        return false;
    }
}
function botFullHouse(card){
    var card = card.sort(function(a, b){return a - b});
    var selected;
    var status = false;
    card.map(value => {
        if(status == true){
            return true
        }else{
            selected = [];
        }
        total = 0;
        card.map(values => {
            if ((value-(value%4))/4 == (values-(values%4))/4) {
                selected.push(values);
                total++;
            }                                                                                
        });
        if (total == 3) {
            if(status == true){
                return true;
            }
            var child = botPair(card, 0, 2);
            if (child) {
                child.map(valueChild => {
                    selected.push(valueChild);
                });
                status = true;
            }                        
        }
    });
    
    if (status) {
        return selected;
    }else{
        return false;
    }                
}
function botStraight(card){
    var card = card.sort(function(a, b){return a - b});
    var selected;
    var status = false;
    card.map(value => {
        if(status == true){
            return true
        }else{
            selected = [];
        }
        selected.push(value);
        total = 1;
        card.map(values => {
            if(status == true){
                return true
            }
    
            if (((selected[selected.length-1]-(selected[selected.length-1]%4))/4)+1 == (values-(values%4))/4) {
                selected.push(values);
                total++;
            }                  
        });
        if (total == 5) {
            status = true;
        }                                                              
    });
    if (status) {
        return selected;
    }else{
        return false;
    }                
}
function botStraightFlush(card){
    var card = card.sort(function(a, b){return a - b});
    var selected;
    var status = false;
    card.map(value => {
        if(status == true){
            return true
        }else{
            selected = [];
        }
        selected.push(value);
        total = 1;
        card.map(values => {
            if(status == true){
                return true
            }
    
            if ((((selected[selected.length-1]-(selected[selected.length-1]%4))/4)+1 == (values-(values%4))/4) && (selected[selected.length-1]%4 == values%4)) {
                selected.push(values);
                total++;
            }                  
        });
        if (total == 5) {
            status = true;
        }                                                              
    });
    if (status) {
        return selected;
    }else{
        return false;
    }                
}
function bot(response){
    if (response.val() && response.val().tablecard) {            
        var tablecard = JSON.parse(response.val().tablecard);
        var giliran = response.val().giliran;
        var playergiliran = response.val().player[giliran];
        var botcard = JSON.parse(playergiliran.card);
        var botselected = [];
        if (playergiliran.status == 'main' && playergiliran.type == 'bot') {            
            if (tablecard.length == 0) {
                botselected = botFullHouse(botcard);
                if (!botselected || botselected.length == 0) {          
                    botselected = botStraightFlush(botcard);
                    if (!botselected || botselected.length == 0) {        
                        botselected = botStraight(botcard);
                        if (!botselected || botselected.length == 0) {     
                            botselected = botPair(botcard);
                        }
                    }
                }
                if(botselected){
                    sendCard(response, botselected);
                }else{
                    console.log('botselected', botselected);
                }
            }else if (tablecard.length == 1 && tablecard[0] > 47) {       
                botselected = botStraightFlush(botcard);
                if (!botselected || botselected.length == 0) {                                    
                    botselected = botPair(botcard, 0, 4);
                    if (!botselected || botselected.length == 0) {                                    
                        botselected = botPairPecah(botcard, tablecard);
                    }                                
                }                                
                if (botselected) {
                    sendCard(response, botselected, function(){
                        if (botselected.length >= 4) {                                
                            firebase.database().ref(room).update({
                                bom: playergiliran.id
                            });
                        }
                    });
                }else{
                    setPas(response, giliran);
                }
            }else if (tablecard.length >= 1 && tablecard.length < 5) {            
                botselected = botPair(botcard, tablecard);
                if (!botselected || botselected.length == 0) {
                    botselected = botPairPecah(botcard, tablecard);
                }
                if (botselected) {
                    sendCard(response, botselected);
                }else{
                    setPas(response, giliran);
                }
            }else if (tablecard.length == 5) {            
                botselected = botMinMatch5(botcard, tablecard);
                if (botselected) {
                    sendCard(response, botselected);
                }else{
                    setPas(response, giliran);
                }
            }else{     
                setPas(response, giliran);
            }                    
        }
    }
}

module.exports = {
    bot: bot,
    setPas: setPas
}