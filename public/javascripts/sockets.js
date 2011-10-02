var socket = io.connect('http://hack.parsely.com:3000');

socket.on('state', function(data) {
  console.log(data);
});

socket.on('setName', function(data) {
  $(".player_" + data.player).empty();
  $(".player_" + data.player).append("<p>" + data.name + "</p>");
  $("p:contains('DEAD')").parent().parent().css("background-color", "red");
});

socket.on('setTime', function(data) {
  $(".time").empty();
  $(".time").append("<p>" + data.time + "</p>");
});

socket.on('setVotes', function(data) {
  $(".votes").empty();
  $(".votes").append("<p>" + data.votes + " Votes Counted</p>");
});
