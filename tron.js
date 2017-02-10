const io = require('socket.io-client');
const ai = require('./ai');

const socket = io('http://localhost:1337');

socket.on('connect', function () {
  socket.emit('join', ai.room, ai.team);
  console.log('Lien vers le match : http://localhost:1337/' + (ai.room || 'null'));
});

socket.on('start', function (config) {
  ai.start(config);
});

socket.on('next', function (prevMoves) {
  socket.emit('move', ai.next(prevMoves));
});

socket.on('end', function (winnerID) {
  ai.end(winnerID);
  process.exit();
});

socket.on('disconnect', function () {
  process.exit();
});
