const tf = require('@tensorflow/tfjs-node')

var model
var xs
var ys
var valXs
var valYs

const prepare = async function (parentPort,workerName,status,eventEmitter) {
  model = tf.sequential();
  model.add(tf.layers.dense({ units: 1, inputShape: [200] }));
  await model.compile({
    loss: 'meanSquaredError',
    optimizer: 'sgd',
    metrics: ['MAE']
  });

  // Generate some random fake data for demo purpose.
  xs = await tf.randomUniform([10000, 200]);
  ys = await tf.randomUniform([10000, 1]);
  valXs = await tf.randomUniform([1000, 200]);
  valYs = await tf.randomUniform([1000, 1]);
  parentPort.postMessage({name:workerName,status:status,type:'report',data:`loaded files`})
  return
}

// Start model training process.
const train = async function (parentPort,workerName,status,eventEmitter) {
  let isTraining = true;

  // 中断できるようにする
  eventEmitter.on('stop', () => {
    console.log('Training interrupted.');
    parentPort.postMessage({name:workerName,status:status,type:'report',data:'Training interrupted.'})
    isTraining = false;
  });

  await model.fit(xs, ys, {
    epochs: 50,
    validationData: [valXs, valYs],
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (!isTraining) {
          model.stopTraining = true
        }
        // ここに各エポック終了時の処理を追加可能
        parentPort.postMessage({name:workerName,status:status,type:'report',data:`training... ${epoch}/50`})
      }
    },
    verbose:false
  });
  parentPort.postMessage({name:workerName,status:status,type:'report',data:'train done'})
  return
}

// Save model.
const save = async function (parentPort,workerName,status,eventEmitter) {
  parentPort.postMessage({name:workerName,status:status,type:'report',data:'saved file'})
  return
}


module.exports = {
  prepare:prepare,
  train:train,
  save:save,
}