const tf = require('@tensorflow/tfjs-node')

const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [200] }));
model.compile({
  loss: 'meanSquaredError',
  optimizer: 'sgd',
  metrics: ['MAE']
});

// Generate some random fake data for demo purpose.
const xs = tf.randomUniform([10000, 200]);
const ys = tf.randomUniform([10000, 1]);
const valXs = tf.randomUniform([1000, 200]);
const valYs = tf.randomUniform([1000, 1]);

// Start model training process.
async function train() {
    let isTraining = true;
  
    // Ctrl+C で中断できるようにする
    process.on('SIGINT', () => {
      console.log('Training interrupted.');
      isTraining = false;
    });
  
      await model.fit(xs, ys, {
        epochs: 5,
        validationData: [valXs, valYs],
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (!isTraining) {
              model.stopTraining = true
            }
            // ここに各エポック終了時の処理を追加可能
          }
        }
      });
  }
  
  train();
