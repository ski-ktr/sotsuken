const tf = require('@tensorflow/tfjs-node')
const fs = require('fs')
const path = require('path')
const {glob} = require('glob')

function encodeDir(filePath) {
  dirName = path.dirname(filePath)
  if (dirName.includes('0')) return 0
  if (dirName.includes('1')) return 1
  if (dirName.includes('2')) return 2
  if (dirName.includes('3')) return 3
  if (dirName.includes('4')) return 4
  if (dirName.includes('5')) return 5
  if (dirName.includes('6')) return 6
  if (dirName.includes('7')) return 7
  if (dirName.includes('8')) return 8
  if (dirName.includes('9')) return 9

  console.error('Unrecognized folder')
  process.exit(1)
}

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

function folderToTensors() {
  return new Promise((resolve, reject) => {
    const FILE_PATH = 'mnist_images'
    const XS = []
    const YS = []

    console.log('Identifying PNG List')
    glob('mnist_images/*/*.png')
    .then(files => {
      console.log(`${files.length} Files Found`)
      console.log('Now converting to tensors')
      files.forEach((file) => {
        const imageData = fs.readFileSync(file)
        const answer = encodeDir(file)
        const imageTensor = tf.node.decodeImage(imageData, 1)

        YS.push(answer)
        XS.push(imageTensor)
      })

      // Shuffle the data (keep XS[n] === YS[n])
      shuffleCombo(XS, YS)

      console.log('Stacking')
      const X = tf.stack(XS)
      const Y = tf.oneHot(YS, 10)

      console.log('Images all converted to tensors:')
      console.log('X', X.shape)
      console.log('Y', Y.shape)

      // Normalize X to values 0 - 1
      const XNORM = X.div(255)
      // cleanup
      tf.dispose([XS, X])

      resolve([XNORM, Y])
    })
    .catch(error => {
      console.error('Failed to access PNG files', error)
      reject()
      process.exit(1)
    })
  })
}

function getModel() {
  const model = tf.sequential()

  // Conv + Pool combo
  model.add(
    tf.layers.conv2d({
      filters: 16,
      kernelSize: 3,
      strides: 1,
      padding: 'same',
      activation: 'relu',
      kernelInitializer: 'heNormal',
      inputShape: [28, 28, 1],
    })
  )
  model.add(
    tf.layers.maxPooling2d({
      poolSize: 2,
      strides: 2,
    })
  )

  // Conv + Pool combo
  model.add(
    tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      strides: 1,
      padding: 'same',
      activation: 'relu',
    })
  )
  model.add(
    tf.layers.maxPooling2d({
      poolSize: 2,
      strides: 2,
    })
  )

  // Conv + Pool combo
  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      strides: 1,
      padding: 'same',
      activation: 'relu',
    })
  )
  model.add(
    tf.layers.maxPooling2d({
      poolSize: 2,
      strides: 2,
    })
  )

  // Flatten for connecting to deep layers
  model.add(tf.layers.flatten())

  // One hidden deep layer
  model.add(
    tf.layers.dense({
      units: 128,
      activation: 'tanh',
    })
  )
  // Output
  model.add(
    tf.layers.dense({
      units: 10,
      activation: 'softmax',
    })
  )

  model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  })

  model.summary()

  return model
}

function printSign(val) {
  console.log(`
  ╔════════════╗
  ║   SAVING   ║
  ║   %${(val * 100).toFixed(2)}   ║
  ╚════════════╝
  `)
}

async function bestValidationSave(model, savePath, best) {
  return {
    onEpochEnd: async (_epoch, logs) => {
      if (logs.val_acc > best) {
        printSign(logs.val_acc)
        model.save(savePath)
        best = logs.val_acc
      }
    },
  }
}

async function doTraing() {
  const [X,Y] = await folderToTensors()

  const model = getModel()

  let best = 0
  await model.fit(X, Y, {
    batchSize: 256,
    validationSplit: 0.1,
    epochs: 20,
    shuffle: true,
    callbacks: bestValidationSave(
      model,
      'saved_model/my_model',
      best
    ),
  })

  tf.dispose([X, Y, model])
}

doTraing()