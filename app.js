var express = require('express');
var app = express();    
var path = require('path');
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});


var monedas=[];
var contadorMonedas=0;
var nivel = 1;
var contadorPlayers=0;
var players = [];
io.on('connection', function (socket) {
  socket.nick = "Player "+contadorPlayers;
  console.log(socket.nick);
  contadorPlayers++;
  var player = {nick:socket.nick,puntos:0,monedas:0};
  players.push(player);

  socket.broadcast.emit("jugador conectado",player);
  socket.emit("jugadores",players);
  

  if(monedas.length==0){
    crearMonedas();
  } else  {
    for (var i = monedas.length - 1; i >= 0; i--) {
      socket.emit("nueva moneda", monedas[i]) ;
    };
  }

  socket.emit("cantidad monedas",monedas.length);
  socket.on("click moneda",function(clave){
      if(quitarMoneda(clave)){
          indicePlayer = recuperarPlayer(socket.nick);
          players[indicePlayer].monedas++;
          players[indicePlayer].puntos+=100;
          if(players[indicePlayer].puntos>=10000){
              monedas=[];
              contadorMonedas=0;
              nivel = 0;
              for (var i = players.length - 1; i >= 0; i--) {
                players[i].monedas=0;
                players[i].puntos=0;
              };
              socket.emit("Gano",players[indicePlayer].nick);
              socket.broadcast.emit("Gano",players[indicePlayer].nick);
              
          }
          if(monedas.length==0){
            nivel++;
            crearMonedas();
          }

        socket.emit("actualizar players",players);
        socket.broadcast.emit("actualizar players",players);


        socket.emit("cantidad monedas",monedas.length);
        socket.broadcast.emit("cantidad monedas",monedas.length);

        socket.emit("quitar moneda",clave);
        socket.broadcast.emit("quitar moneda",clave);
      }
  })

  socket.on("disconnect",function(){
      socket.broadcast.emit("desconectado",socket.nick);
     players.splice(recuperarPlayer(socket.nick),1);

     if(players.length==0){
        monedas=[];
        contadorMonedas=0;
        nivel = 1;
        contadorPlayers=0;
        players = [];
     }
  });

  function crearMonedas(){
     for (var i = nivel - 1; i >= 0; i--) {
          var ancho = Math.floor(Math.random() * (760 - 40 + 1)) + 40;
          var alto = Math.floor(Math.random() * (560 - 40 + 1)) + 40;
          var nombre="moneda"+contadorMonedas;
          contadorMonedas++;
          nuevaMoneda = {x:ancho,y:alto,clave:nombre};
          monedas.push(nuevaMoneda)
          socket.emit("nueva moneda",nuevaMoneda) ;
          socket.broadcast.emit("nueva moneda",nuevaMoneda);
      };
  }
   
});

function quitarMoneda(clave){
  for (var i = monedas.length - 1; i >= 0; i--) {
    if(monedas[i].clave==clave){
      monedas.splice(i,1);
      return true;
    }
  };

  return false;
}

function recuperarPlayer(nick){

  for (var i = players.length - 1; i >= 0; i--) {
    if(players[i].nick == nick)
      return i;
  };

  return 0;
}