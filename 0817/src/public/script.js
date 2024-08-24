var socket = io();

var name_text = document.getElementById('name_text');
var start_button = document.getElementById('start_button');
var stop_button = document.getElementById('stop_button');
var output = document.getElementById('output');

var nick_name = name_text.value;

socket.on('connect', function() {
  socket.emit('name', name_text.value,name_text.value);// 何かの拍子にクライアントが先にオンラインだった場合にサーバにnameを通知するため
});

name_text.addEventListener('input', function(e) {
  console.log(name_text.value);
  socket.emit('name', nick_name,name_text.value);
  nick_name = name_text.value;

  output.value = ''
});

start_button.addEventListener('click', function(e) {
  console.log('start_clicked');
  socket.emit('start', nick_name);
});

stop_button.addEventListener('click', function(e) {
  console.log('stop_clicked');
  socket.emit('stop', nick_name);
});

socket.on('output', function(msg) {
  output.value = output.value + msg + '\n';
});