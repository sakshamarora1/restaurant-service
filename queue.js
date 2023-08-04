const amqp = require("amqplib")

const QUEUE_NAMES = ['chef1', 'chef2'];
const DistributedProcessorURI = "amqp://guest:guest@localhost:5672//"

async function sendOrderToQueue(order, channel) {
  try {
    let shortestQueue = QUEUE_NAMES[0];
    let shortestQueueLength = await getQueueLength(shortestQueue, channel);

    // Find the queue with the shortest length
    for (const queue of QUEUE_NAMES.slice(1)) {
      const queueLength = await getQueueLength(queue, channel);
      if (queueLength < shortestQueueLength) {
        shortestQueue = queue;
        shortestQueueLength = queueLength;
      }
    }

    await channel.assertQueue(shortestQueue, { durable: true })

    channel.sendToQueue(shortestQueue, Buffer.from(JSON.stringify(order)), {
      persistent: true
    })

    console.log(`Order sent to ${shortestQueue}: ${order._id}`)
  } catch (error) {
    console.error("Error sending order to worker queues: ", error)
  }
}

// Function to get the length of a queue
async function getQueueLength(queue, channel) {
  try {
    const { messageCount } = await channel.assertQueue(queue);
    // Not working, always returning 0
    return messageCount;
  } catch (error) {
    console.error(`Error getting queue length for ${queue}:`, error);
    return -1;
  }
}

module.exports = {
  QUEUE_NAMES,
  DistributedProcessorURI,
  sendOrderToQueue,
  getQueueLength
}
