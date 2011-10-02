var socket = io.connect('http://localhost');

socket.on('state', function(data) {
  console.log(data);
});

socket.on('setName', function(data) {
  $(".player_" + data.player).empty();
  $(".player_" + data.player).append("<p>" + data.name + "</p>");
});
