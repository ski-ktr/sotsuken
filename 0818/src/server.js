const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const {EventEmitter} = require('events')
const eventEmitter = new EventEmitter();

const {start_learning,check_lerning,stop_learning,exit_learning,reset_learning} = require('./helper');
const { start } = require('repl');

app.get('/', (req, res) => {
  res.sendFile(__dirname+'/public/index.html');
});

app.use('/public/', express.static(__dirname+'/public'))

var onlineUsers = []

function private_emit(nick_name,event,param){
  const userIds = onlineUsers.filter(user => user.nick_name == nick_name).map(user => user.id);
  userIds.forEach(id => {
    io.to(id).emit(event, param);
  });
}

eventEmitter.on(`log`, (nick_name,msg) => {
  private_emit(nick_name,'output',msg)
});

io.on('connection', (socket) => {
  console.log('user connected')
  onlineUsers.push({id: socket.id, nick_name: ''});

  socket.on('disconnect', () => {
    console.log('user disconnected');
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
  });

  socket.on('name', (old_name,new_name) => {
    console.log(`${old_name} changed to ${new_name}`);
    const user = onlineUsers.find(user => user.id === socket.id);
    if (user) { user.nick_name = new_name; }
  });

  socket.on('start', (nick_name) => {
    console.log(`${nick_name} order to start`);
    var msg = 'server: starting'
    private_emit(nick_name,'output', msg);
    start_learning(nick_name,eventEmitter)
  });

  socket.on('stop', (nick_name) => {
    console.log(`${nick_name} order to stop`);
    var msg = 'server: stopping'
    private_emit(nick_name,'output', msg);
    stop_learning(nick_name)
  });

  socket.on('userlist', (nick_name) => {
    console.log(`${nick_name} order to userlist`);
    const util = require('util')
    var msg = util.format(onlineUsers)
    private_emit(nick_name,'output', msg);
    stop_learning(nick_name)
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});