function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getRoom(){
    var url = window.location.href;
    var name = 'room';
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return 'games';
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function setSit(playerId, sitNo, callBack){
    firebase.database().ref(room).once('value').then(function(response){                   
        var players = response.val().player;
        if (getPlayerBySit(players, sitNo)===false) {        
            firebase.database().ref(room+'/player/'+playerId).update({
                card:'[]',
                sitno:parseInt(sitNo),
                status:'menunggu'
            }).then(function(){
                callBack(playerId, sitNo);
            });
        }else{
            swal("Oops", "Maaf, Tempat Duduk Sudah Terisi" , "error");
        }
    });
}
function showPlayer(response, callBack){
    if (response) {        
        // show tablecard
        if (response && response.tablecard) {
            var tablecard = '';
            if(response.tablecardplayer && typeof response.player[response.tablecardplayer].name !== 'undefined'){
                var tablecard = '<div class="cardplayer"><label class="badge badge-primary">'+ response.player[response.tablecardplayer].name +'</label></div>';
            }

            if(response.tablecardhistory !== 0){
                response.tablecardhistory.forEach(function(value) {
                    tablecard += '<div class="tablecard-container" style="transform: rotate('+value.rotate+'deg);">';
                    JSON.parse(value.card).forEach(function(values) {
                        tablecard += '<img class="tablecard pas img-thumbnail" src="assets/img/card/small/'+values+'.png">';
                    });
                    tablecard += '</div>';
                });    
            }

            tablecard += '<div class="tablecard-container" style="transform: rotate('+response.tablecardrotate+'deg);">';
            JSON.parse(response.tablecard).forEach(function(value) {
                tablecard += '<img class="tablecard img-thumbnail" src="assets/img/card/small/'+value+'.png">';
            });
            tablecard += '</div>';

            if(response.warisan && typeof response.player[response.warisan].name !== 'undefined'){
                tablecard += '<div class="warisan"><small class="badge badge-warning">Warisan: '+ response.player[response.warisan].name +'</small></div>';
            }
            if(response.bom && typeof response.player[response.bom].name !== 'undefined'){
                tablecard += '<img src="assets/img/bom.png?v=2" style="position:absolute;left:0px;top:0px" >';
            }
            $('#tablecard').html(tablecard);
        }
        
        $('.player-wrap').html('');
        $('button.sit').show();
        $('.stand-up').hide();
        var mecard = '';
        for (var i = 1; i <= 10; i++) {
            var player = getPlayerSitNo(response.player, i);
            var playerName = '<div class="card-header">'+player.name+'</div>';
            var playerStatus = '<div class="card-footer">'+player.status+'</div>';
            var playerTime = '';
            var giliran = 'bg-dark';
            if (response.giliran && response.giliran == player.id) {
                giliran = 'bg-warning';
                playerTime = '<div class="card-footer"><div class="progress"><div style="width: '+response.timer+'%;" class="progress-bar"></div></div></div>';
            }        
            var avatar = '<img src="'+player.picture+'" class="img-thumbnail">';
            if (player !== false) {
                var properti = '';
                if (response.loser==player.id) {                
                    properti = '<img class="loser" src="assets/img/loser.png">';
                }
                if (response.juara==player.id) {                
                    properti = '<img class="piala" src="assets/img/piala.png"><img class="mahkota" src="assets/img/mahkota.png">';
                }
                $('.sit-'+i).hide();
                if (me && me.id==player.id) {
                    $('button.sit').hide();
                    if(player.status == 'main' || player.status == 'pas'){
                        $('.stand-up').hide();
                    }else{
                        $('.stand-up').show();
                    }                    
                }
                var playerCard = '<div class="player-card-small">';
                var kartuSelected;
                JSON.parse(player.card).sort(function(a, b){return a - b}).forEach(function(value, index) {
                    kartuSelected = '';
                    if (cardSelected.length > 0){                                    
                        if (cardSelected.indexOf(value)!= -1) {
                            kartuSelected = 'active';
                        }
                    }                
                    
                    playerCard += '<img class="card-small img-thumbnail" src="assets/img/card/small/back.png">';
                    if (me && player.id == me.id) {
                        mecard += '<a href="javascript:void(0)" class="kartu '+kartuSelected+'" data-index="'+index+'" data-value="'+value+'"><img class="card img-thumbnail" src="assets/img/card/small/'+value+'.png"></a>';
                    }
                });
                playerCard += '</div>';
                $('.player-wrap').append('<div class="card text-white '+giliran+' '+player.status+' player sit sit-'+i+'">'+playerName+'<div class="card-body">'+avatar+'</div>'+playerTime+playerStatus+playerCard+properti+'</div>');
            }
        }
        $('#mecard').html(mecard);
    }
    callBack(response);
}
function getPlayerSitNo(players, sitNo){
    var player = false;
    Object.values(players).forEach(function(value) {
        if (value.sitno == sitNo) {
            player = value;
            return false;
        }
    });
    return player;
}

function setPas(playerId, callBack = function(){}){
    firebase.database().ref(room).once('value').then(function(response){                   
        var players = response.val().player;
        var bom = response.val().bom;
        var giliran = response.val().giliran;
        firebase.database().ref(room+'/player/'+playerId).update({
            status: 'pas'
        }).then(function(){          
            $('#btn-pas').prop('disabled', false);
            setLoserByBom(function(){
                changeGiliran(giliran, function(){
                    checkReset();
                });                    
            });                    
        });
    }).then(function(){
        callBack(playerId, callBack);
    });
}
function setStandUp(playerId, callBack = function(){}){
    firebase.database().ref(room).once('value').then(function(response){        
        var players = response.val().player;
        var giliran = response.val().giliran;
        var tablecardplayer = response.val().tablecardplayer;
        var sitno = getSitByPlayer(players, playerId);
        firebase.database().ref(room+'/player/'+playerId).update({
            card:'[]',
            sitno:0,
            status:'nonton'
        }).then(function(){
            if (sitno == 10) {
                sitno = 1;
            }else{
                sitno++;
            }                
            for (var i = 1; i <= 10; i++) {
                player = getPlayerBySit(players, sitno);
                if (tablecardplayer == playerId) {                    
                    if (player.status && player.status != 'menang' && player.status != 'menunggu') {
                        firebase.database().ref(room).update({
                            warisan:player.id
                        });
                        break;
                    }
                }                
                if (giliran == playerId) {
                    if (player.status == 'main') {
                        firebase.database().ref(room).update({
                            giliran:player.id
                        });
                        break;                        
                    }
                }
                if (sitno == 10) {
                    sitno = 1;
                }else{
                    sitno++;
                }
            }
        });                                
    }).then(function(){
        callBack(playerId);        
    });    
}
function getTotalPlayer(player){
    var total = 0;
    Object.values(player).forEach(function(value) {
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
    Object.values(players).forEach(function(value) {
        if (value.id == player) {
            status = value.sitno;
            return false;
        }
    });
    return status;
}
function getPlayerBySit(player,sitno){
    var status = false;
    Object.values(player).forEach(function(value) {
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
    Object.values(players).forEach(function(value) {
        if (value.card != '[]' && (value.status == 'main' || value.status == 'pas')) {
            if(typeof value.id !== 'undefined'){
                firebase.database().ref(room).update({                 
                    loser: value.id
                });    
            }
        }
    });
    callBack(players);
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

function checkReset(){
    console.log('checkReset');
    firebase.database().ref(room).once('value').then(function(response){        
        var players = response.val().player;
        var totalPlayerCard = 0;
        var totalPlayerSit = 0;
        Object.values(players).forEach(function(value) {
            if (value.card != '[]' && typeof value.card !== 'undefined' && value.id) {
                totalPlayerCard += 1;
            }
            if (value.sitno && value.sitno != 0) {
                totalPlayerSit += 1;
            }
        });
        console.log('ceking',totalPlayerSit, totalPlayerCard);
        if (totalPlayerSit == 1 || (totalPlayerSit > 1 && totalPlayerCard <= 1)) {
            if (totalPlayerSit > 1) {
                setLoser(players, function(){                    
                    resetGame();
                });                
            }else{                
                resetGame();
            }
        }
    });
}

function resetGame(){
    cardSelected = [];
    console.log('resetGame');
    firebase.database().ref(room).once('value', function(response) {   
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
        Object.values(card).forEach(function(value, index) {
            playerCard[index % totalPlayer].push(value);
        });
        var i = 0;
        Object.values(player).forEach(function(value) {
            if (value.sitno && value.sitno != 0 && typeof value.sitno !== 'undefined' && totalPlayer > 1) {
                firebase.database().ref(room+'/player/'+value.id).update({
                    card: JSON.stringify(playerCard[i]),
                    status: 'main'
                });
                i++;
            }else{
                firebase.database().ref(room+'/player/'+value.id).update({                 
                    card: '[]',
                    status: 'menunggu'
                }); 
            }
        });
        var giliran = setGiliran(response.val());
        firebase.database().ref(room).update({
            giliran: giliran,
            winner:0,
            bom:0,
            tablecard:'[]',
            tablecardplayer:0,
            tablecardhistory:0,
            warisan:0,
            juara:juara,
            timer:100
        });
    });
}
function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}
function setWarisan(callBack){
    firebase.database().ref(room).once('value', function(response) {                                    
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
            if (player.status && player.status == 'main') {
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
    }).then(function(){
        callBack();
    });
}

function getLastTableCardHistoryID(tablecardhistory){
    var id = 1;
    Object.values(tablecardhistory).forEach(function(value) {    
        id++;
    });
    return id;   
}

function sendCard(cardSelected, callBack = function(){}){
    var rotate = Math.floor(Math.random() * 360);
    firebase.database().ref(room).once('value', function(response) {
        var lastidcardhistory = getLastTableCardHistoryID(response.val().tablecardhistory);
        var giliran = response.val().giliran;
        var bom = response.val().bom;
        if (bom !== 0 && typeof bom !== 'undefined') {
            firebase.database().ref(room).update({
                bom:giliran
            });
        }
        var playerCard = JSON.parse(response.val().player[giliran].card);  
        firebase.database().ref(room+'/tablecardhistory/'+lastidcardhistory).update({
            card: JSON.stringify(cardSelected),
            rotate: rotate
        });    
        firebase.database().ref(room).update({
            tablecard:JSON.stringify(cardSelected),
            tablecardplayer:response.val().player[giliran].id,
            tablecardrotate: rotate
        }).then(function(){
            firebase.database().ref(room).update({
                warisan:0
            }).then(function(){                
                Object.values(cardSelected).forEach(function(value) {
                    remove(playerCard, value);
                });            
                firebase.database().ref(room+'/player/'+giliran).update({
                    card:JSON.stringify(playerCard)
                }).then(function(){   
                    if (playerCard.length == 0) {
                        firebase.database().ref(room+'/player/'+giliran).update({
                            status:'menang'
                        }).then(function(){
                            setWarisan(function(){
                                if (response.val().winner == 0 || typeof response.val().winner === 'undefined') {
                                    firebase.database().ref(room).update({
                                        winner:giliran,
                                        juara:giliran
                                    }).then(function(){
                                        changeGiliran(giliran, function(){
                                            checkReset();
                                        });                                                
                                    });
                                }else{
                                    changeGiliran(giliran, function(){
                                        checkReset();
                                    });
                                }
                            });
                        });
                    }else{
                        changeGiliran(giliran, function(){
                            checkReset();
                        });
                    }
                });
            });
        });
    }).then(function(){
        callBack(cardSelected);
    });
}

function changeGiliran(giliran = 0, callBack = function(){}){
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

        console.log('getCountPlay', getCountPlay(players));
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
                            console.log('masuk sini', players);
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
        callBack(giliran);
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
                    tablecardhistory:0,
                    warisan:0
                });                
            });            
        }
    });
}
function getCountPlay(players){
    var total = 0;
    Object.values(players).forEach(function(value) {
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
    Object.values(cardSelected).forEach(function(value) {
        cardStraight.push((value - (value % 4)) / 4);
    });
    cardStraight.sort(function(a,b){return a-b});
    var a = -1, b = true;
    Object.values(cardStraight).forEach(function(value) {
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
    Object.values(cardSelected).forEach(function(value) {
        cardFlush.push(value % 4);
    });
    Object.values(cardFlush).forEach(function(value){
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
    Object.values(cardSelected).forEach(function(value) {
        cardFullHouse.push((value - (value % 4)) / 4);
    });                
    Object.values(cardFullHouse).forEach(function(value){
        if($.inArray(value, uniqueCardFullHouse) === -1) uniqueCardFullHouse.push(value);
    });
    if (uniqueCardFullHouse.length == 2) {
        var a = uniqueCardFullHouse[0];
        var b = uniqueCardFullHouse[1];
        var aa = 0;
        var bb = 0;
        var big = 0;
        Object.values(cardFullHouse).forEach(function(value){
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
        Object.values(cardSelected).forEach(function(value) {
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
function setLoserByBom(callBack){
    firebase.database().ref(room).once('value').then(function(response){
        var players = response.val().player;
        var giliran = response.val().giliran;
        var bom = response.val().bom;
        if (bom !== 0 && typeof bom !== 'undefined') {    
            firebase.database().ref(room).update({
                loser: giliran                
            });
        }    
    }).then(function(){    
        callBack();
    });
}
function addBot(){
    var dewaJudiList = ['Chow Yun Fat', 'Stephen Chow', 'Andy Lau', 'Ng Man-tat', 'Charles Heung', 'Shing Fui-On', 'Lung Fong', 'Jhon Ching', 'Wong Yat-fei', 'Wong Jing'];
    firebase.database().ref(room).once('value', function(response) {
        for (var i = 1; i <= 10; i++) {
            var pos = Math.floor(Math.random() * 10)+1;
            if (getPlayerBySit(response.val().player, pos) == false) {
                firebase.database().ref(room+'/player/'+pos).update({
                    id:pos,
                    name: dewaJudiList[pos-1],
                    status:'menunggu',
                    card:'[]',
                    sitno:pos,
                    picture:'assets/img/bot/bot'+pos+'.jpg',
                    type:'bot'
                }).then(function(){
                    checkReset();
                });
                break;
            }
        }
    });                
}
function removeBot(){
    firebase.database().ref(room+'/player').once('value', function(response) {
        Object.values(response.val()).forEach(function(value) {
            if (value.type == 'bot' && value.sitno != 0) {
                setStandUp(value.id, function(){                    
                    checkReset();
                    return false;
                });
            }
        });
    });
}
function botPair(card, tablecard = 0, count = 0){
    var card = card.sort(function(a, b){return a - b});
    var selected, total, status;
    status = false;
    Object.values(card).forEach(function(value) {
        selected = [];
        total = 0;
        Object.values(card).forEach(function(values) {
            if ((value-(value%4))/4 == (values-(values%4))/4) {
                selected.push(values);
                total++;
            }                        
        });                    
        if (tablecard !== 0) {
            if (total == tablecard.length) {
                if (Math.max.apply(Math, selected) > Math.max.apply(Math, tablecard)) {
                    status = true;
                    return false;
                }
            }
        }else{          
            if (count !== 0) {
                if (total == count) {
                    status = true;
                    return false;                                
                }
            }else{                            
                status = true;    
                return false;
            }
        }
    });
    if (status) {
        return selected;
    }else{
        return false;
    }
}
function sendChat(){
    if (me && typeof me.name !== 'undefined') {                    
        firebase.database().ref(room+'/chat').update({
            message:encodeHTML($('#input-chat').val()),
            from:me.name
        }).then(function(){                    
            $('#input-chat').val('');
        });                                                                
    }else{
        swal("Oops", "Silahkan login terlebih dahulu" , "error");
    }
}
function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
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