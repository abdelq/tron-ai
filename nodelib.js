var Grid = {
    create: function() {},
    colorCell: function() {}
};

var WebSocket = require('ws');

var server = {
    host: 'localhost',
    port: '1337'
};

var ws = new WebSocket("ws://" + server.host + ":" + server.port);

function message(str) {
    console.log(str);
}

for(cb in callbacks) {
    ws.on(cb, callbacks[cb]);
}
