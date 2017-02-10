var server = {
    host: 'localhost',
    port: '1337'
};

// Actions received via websocket
var actions = {
    start: function(infos) {
        message("Début de la partie : vous êtes le joueur #" + infos.config.me);
        createGrid(infos.config);
    },
    nextMove: function(params) {
        var m = nextMove(params.moves);
        ws.send(m);
    },
    win: function(params) {
        victory(params.id);
        message("Victoire du joueur #" + params.id);
        ws.close();
    },
    tie: function(params) {
        victory(false);
        message("Match nul ! Tous les joueurs sont morts !");
        ws.close();
    },
};

var callbacks = {
    open: function() {
        message("En attente du début de partie...");
    },
    error: function() {
        message('Erreur de connexion, vérifiez que le serveur est lancé');
    },
    close: function() {
        message('Déconnexion du serveur');
    },
    message: function(params) {
        if(typeof(params) !== 'string' && "data" in params)
            params = params.data;
        
        params = JSON.parse(params);
        
        if("action" in params && params.action in actions) {
            actions[params.action](params);
        }
    },
};
