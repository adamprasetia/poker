$('document').ready(function(){
    $('#btnTotalPlayer').click(function(){
        console.log("btnTotalPlayer click");
        firebase.database().ref('games/player').remove(function(){            
            console.log("player remove");
            var totalPlayer = parseInt($('#txtTotalPlayer').val());
            console.log('total player:',totalPlayer);
            for (var i = 0; i < totalPlayer; i++) {
                firebase.database().ref('games/player/'+i).set({
                    id:i
                });                
                console.log('add player:',i);
            }
        });           
    });
    $('#btnBagiKartu').click(function(){
        var config_total_player = parseInt($('#txtTotalPlayer').val());
        var config_total_kartu = parseInt($('#txtTotalCard').val());
        var kartu = new Array(config_total_kartu);
        for (var i = 0; i < kartu.length; i++) {
            kartu[i] = i;
        }
        kartu = shuffle(kartu);
        var playerCard = new Array(config_total_player);
        var player = new Array(config_total_player);
        for (var i = 0; i < config_total_player; i++) {
            playerCard[i] = [];
            player[i] = i;
        }
        $.each(kartu, function(index, value) {
            // console.log(index, value);
            // console.log(index, index % (config_total_player));
            playerCard[index % config_total_player].push(value);
        });
        firebase.database().ref('games').remove(function(){            
            $.each(playerCard, function(index, value) {
                console.log(index, JSON.stringify(value));
                // console.log(index, index % (config_total_player));
                // player[index % config_total_player].push(index);

                firebase.database().ref('games/player/'+index).update({                 
                    id:index,
                    card: JSON.stringify(value),
                });                   
            });
        });
        // console.log(player);
        firebase.database().ref('games').update({
            card_on_arena:-1,
            giliran:JSON.stringify(player),
            peserta:JSON.stringify(player),
            pemenang:-1,
            winner:-1
        });                                
    });
});