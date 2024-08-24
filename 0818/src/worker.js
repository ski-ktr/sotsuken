const { parentPort,workerData,threadId } = require('worker_threads')
const { prepare,train,save } = require('./tensorflow')
const workerName = workerData.name
const workingDirectory = workerData.dir
const {EventEmitter} = require('events')
const eventEmitter = new EventEmitter();

const exec = async () => {
  var status = 'prepare'
  var progress = 0

  parentPort.on('message', (message) => {
    console.log(message)
    if(message.type == 'check'){
      parentPort.postMessage({name:workerName,status:status,type:'report',data:threadId})
    }else if(message.type == 'update'){
      status = message.data
      eventEmitter.emit('stop')
      console.log('stopイベント発火')
    }
  });

  status = 'prepare'
  await prepare(parentPort,workerName,status,eventEmitter)
  //load file and convert to binary.
  parentPort.postMessage({name:workerName,status:status,type:'report',data:'ready'})

  status = 'running'
  // for(; progress < 10; progress++){
  //   if(status == 'running'){
  //     for(let i = 0; i < 5999999999; i++);
  //     //do work
  //     parentPort.postMessage({name:workerName,status:status,type:'report',data:progress})
  //   }
  //   if(status == 'exit'){
  //     progress.exit()
  //   }
  //   if(status == 'reset'){
  //     progress = 0
  //     status = 'running'
  //   }
  //   if(status == 'stop'){
  //     progress--
  //   }
  // }
  // progress = 10
  await train(parentPort,workerName,status,eventEmitter)
  parentPort.postMessage({name:workerName,status:status,type:'report',data:'done'})

  status = 'completing'
  await save(parentPort,workerName,status,eventEmitter)
  //save file.
  parentPort.postMessage({name:workerName,status:status,type:'report',data:'complete'})
  process.exit()
}
exec()