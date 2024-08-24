const tf = require('@tensorflow/tfjs-node')

const fs = require('fs')
const path = require('path')
const {glob} = require('glob')

const mobilenet = require('@tensorflow-models/mobilenet')

function fileToTensor(filePath,size){
  const rawimage = fs.readFileSync(filePath)
  const imageTensor = tf.node.decodeImage(rawimage,3)
  const resizedTensor = tf.image.resizeBilinear(imageTensor,size)
  const normalizedTensor = tf.cast(resizedTensor.div(tf.scalar(255)), dtype = 'float32');
  return normalizedTensor
}

function folderToTensors(dirPath) {
  return new Promise((resolve, reject) => {
    const XS = []
    const YS = []
    const dirs = []
    console.log('Identifying PNG List')
    glob(`${dirPath}/*/*.png`)
    .then(files => {
      console.log(`${files.length} Files Found`)
      console.log('Now converting to tensors')
      files.forEach((file) => {
        // console.log(file)
        const dir = path.basename(path.dirname(file))
        if (!dirs.includes(dir)) {
          dirs.push(dir)
        }
        const answer = dirs.indexOf(dir)
        const imageTensor = fileToTensor(file,[224,224])
        // console.log(imageTensor.shape)
        YS.push(answer)
        XS.push(imageTensor)
      })
      // Shuffle the data (keep XS[n] === YS[n])
      function shuffleCombo(array, array2) {
        let counter = array.length
        console.assert(array.length === array2.length)
        let temp, temp2
        let index = 0
        while (counter > 0) {
          index = (Math.random() * counter) | 0
          counter--
          temp = array[counter]
          temp2 = array2[counter]
          array[counter] = array[index]
          array2[counter] = array2[index]
          array[index] = temp
          array2[index] = temp2
        }
      }
      shuffleCombo(XS, YS)
      
      console.log('Stacking')
      const X = tf.stack(XS)
      const Y = tf.oneHot(YS, dirs.length)

      console.log('Images all converted to tensors:')
      console.log('X', X.shape)
      console.log('Y', Y.shape)

      // Normalize X to values 0 - 1
      const XNORM = X.div(255)
      // cleanup
      tf.dispose([XS, X])

      resolve([XNORM, Y, dirs])
    })
    .catch(error => {
      console.error('Failed to access PNG files', error)
      reject()
      process.exit(1)
    })
  })
}

async function runIt() {
  console.log('Loading images - this may take a while...')
  const folderPath = 'c:/users/kosan/desktop/sotsuken/images'
  const [X,Y,dirs] = await folderToTensors(folderPath)

  // Load feature model
  const tfhubURL =
    'https://www.kaggle.com/models/google/mobilenet-v2/TfJs/140-224-feature-vector/3'
  const featureModel = await tf.loadGraphModel(tfhubURL, {
    fromTFHub: true,
  })
  console.log('Creating features from images - this may take a while...')
  const featureX = featureModel.predict(X)
  // Push data through feature detection
  console.log(`Features stack ${featureX.shape}`)

  // Create NN
  const transferModel = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [featureX.shape[1]],
        units: 64,
        activation: 'relu',
      }),
      tf.layers.dense({ units: dirs.length, activation: 'softmax' }),
    ],
  })

  transferModel.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  })

  console.log(featureModel.summary())
  console.log(transferModel.summary())

  const history = await transferModel.fit(featureX, Y, {
    validationSplit: 0.2,
    epochs: 20,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (false) {
          model.stopTraining = true
        }
        // console.log(epoch)
      }
    },
    verbose:false
  })
  // console.log(history)
}

runIt()

