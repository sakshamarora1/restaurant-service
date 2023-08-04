const amqp = require("amqplib")

const QUEUE_NAMES = ['chef1', 'chef2'];
const DistributedProcessorURI = "amqp://guest:guest@localhost:5672//"
var i = 0

async function sendOrderToQueue(order, channel) {
  try {
    queue = QUEUE_NAMES[i % 2]
    i += 1
    await channel.assertQueue(queue, { durable: true })

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(order)), {
      persistent: true
    })

    console.log(`Order sent to ${queue}: ${order._id}`)
  } catch (error) {
    console.error("Error sending order to worker queues: ", error)
  }
}

module.exports = {
  QUEUE_NAMES,
  DistributedProcessorURI,
  sendOrderToQueue
}
