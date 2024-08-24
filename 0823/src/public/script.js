var socket = io();

var name_text = document.getElementById('name_text');
var start_button = document.getElementById('start_button');
var stop_button = document.getElementById('stop_button');
var output = document.getElementById('output');
var userlist_button = document.getElementById('userlist_button');
var clear_button = document.getElementById('clear_button');
var trainingData = document.getElementById('trainingData');
var upload_button = document.getElementById('upload_button');
var checkData = document.getElementById('checkData');
var check_button = document.getElementById('check_button');

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

userlist_button.addEventListener('click', function(e) {
  console.log('userlist_clicked');
  socket.emit('userlist', nick_name);
});

clear_button.addEventListener('click', function(e) {
  console.log('clear_clicked');
  output.value = ''
});

socket.on('output', function(msg) { // テキストエリアを自動スクロール
  output.value = output.value + msg + '\n';
  output.scrollTop = output.scrollHeight;
});