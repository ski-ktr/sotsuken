const { Worker, isMainThread, parentPort, threadId } = require('worker_threads')

var workers = []

const start_learning = function (name,eventEmitter) {
  let worker = new Worker(__dirname+'/worker.js', {
    workerData: {name:name,dir:''},
  });
  workers.push({ name:name,dir:'',worker:worker });
  console.log(`push${name} worker, workers:(${workers.length})`)

  // worker からのメッセージ受信 (エラー処理など)
  worker.on('message', (message) => {
    console.log(`Worker ${message.name}(${message.status}): [${message.type}]${message.data}`);
    eventEmitter.emit(`log`,name,`Worker ${message.name}(${message.status}): [${message.type}]${message.data}`)
  });

  worker.on('exit', (code) => {
    console.log(`Worker exited with code ${code}`);
    workers = workers.filter((w) => w.name !== name)
    console.log(`pop${name} worker, workers:(${workers.length})`)
  });
};

const check_lerning = function(name) {
  let worker = workers.find((w) => w.name === name);
  if (worker) {
    // worker に確認信号を送る (実装例)
    worker.worker.postMessage({type:'check'});
  }
}

const stop_learning = function (name) {
  let worker = workers.find((w) => w.name === name);
  // const util = require('util')
  console.log(`stop_function(${name})まできた、のうち${worker}が該当するらしい。`)
  if (worker) {
    // worker に終了信号を送る (実装例)
    console.log('2stop_function()まできた')
    worker.worker.postMessage({type:'update',data:'stop'});
  }
}

const exit_learning = function (name) {
  let worker = workers.find((w) => w.name === name);
  if (worker) {
    // worker に終了信号を送る (実装例)
    worker.worker.postMessage({type:'update',data:'exit'});
  }
}

const reset_learning = function (name) {
  let worker = workers.find((w) => w.name === name);
  if (worker) {
    // worker に終了信号を送る (実装例)
    worker.worker.postMessage({type:'update',data:'reset'});
  }
}

module.exports = {
  start_learning:start_learning,
  check_lerning:check_lerning,
  stop_learning:stop_learning,
  exit_learning:exit_learning,
  reset_learning:reset_learning,
}

// const {create_env} = require('./helper')