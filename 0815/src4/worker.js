const { parentPort,workerData,threadId } = require('worker_threads')
const workerName = workerData.name
const workingDirectory = workerData.dir

var status = 'prepare'
var progress = 0

parentPort.on('message', (message) => {
  console.log(message)
  if(message.type == 'check'){
    parentPort.postMessage({name:workerName,status:status,type:'report',data:threadId})
  }else if(message.type == 'update'){
    status = message.data
  }
});

status = 'prepare'
for(let i = 0; i < 99999999; i++);
//load file and convert to binary.
parentPort.postMessage({name:workerName,status:status,type:'report',data:'loaded file'})

status = 'running'
for(; progress < 10; progress++){
  if(status == 'running'){
    for(let i = 0; i < 5999999999; i++);
    //do work
    parentPort.postMessage({name:workerName,status:status,type:'report',data:progress})
  }
  if(status == 'exit'){
    progress.exit()
  }
  if(status == 'reset'){
    progress = 0
    status = 'running'
  }
  if(status == 'stop'){
    progress--
  }
}
progress = 10
parentPort.postMessage({name:workerName,status:status,type:'report',data:'done'})

status = 'completing'
for(let i = 0; i < 99999999; i++);
//save file.
parentPort.postMessage({name:workerName,status:status,type:'report',data:'complete'})
process.exit()