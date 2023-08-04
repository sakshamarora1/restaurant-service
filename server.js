const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const amqp = require("amqplib")
const { connectToDatabase, getDb, ObjectId } = require("./db")
const { QUEUE_NAMES, DistributedProcessorURI, sendOrderToQueue } = require("./queue")
const { prepareDish } = require("./chef")

const app = express()
const port = 3000

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
})

// Middleware
app.use(express.json())

// In-memory orders list, Replace later with DB
// const ordersDb = []
const availableDishes = ["Pizza", "Burger", "Paneer", "Eggs", "Chicken", "Pasta", "Salad", "Tea"]

let connection, channel

// In-memory worker/chef queue
// const orderQueue = []

// Route to accept orders
app.post("/order", async (req, res) => {
  try {
    const { dish, specialInstructions } = req.body
    const db = getDb()

    if (!dish) {
      return res.status(400).json({ error: "Dish name is required." })
    }
    if (!availableDishes.includes(dish)) {
      return res.status(400).json({ error: `Dish: ${dish} is not available.` })
    }

    const order = {
      dish: dish,
      specialInstructions: specialInstructions,
      status: "PENDING",
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    }
    // TODO: Add worker queues for waiters too
    console.log("Waiter receiving: ", order)
    io.emit("ORDER_RECEIVNG", order)

    // Time taken to take an order, replace with some validations maybe?
    await new Promise(resolve => setTimeout(resolve, 2000))

    order.status = "TAKEN"
    order.updatedAt = new Date().toLocaleString()
    console.log("New Order: ", order)

    // ordersDb.push(order)
    await db.collection("orders").insertOne(order)
    io.emit("ORDER_TAKEN", order)

    // orderQueue.push(order)
    await sendOrderToQueue(order, channel)
    return res.status(201).json(order)
  } catch (error) {
    return res.status(500).json({ error: "Server Error: " + error })
  }
})

// Route to serve prepared orders
app.post("/serve", async (req, res) => {
  try {
    const ordersReady = orders.filter(order => order.status === "COMPLETED")
    return res.status(200).json(ordersReady)
  } catch (error) {
    return res.status(500).json({ error: "Server Error: " + error })
  }
})

httpServer.listen(port, async () => {
  try {
    await connectToDatabase()
    console.log(`Server is running on http://localhost:${port}`)

    connection = await amqp.connect(DistributedProcessorURI)
    channel = await connection.createChannel()

    await startWorkers(channel)
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
})

// Check for new orders every second
// setInterval(() => {
//   prepareDishes().catch(error => console.error("Worker error: " + error))
// }, 1000)

// Log OrdersDb snapshot every 5 seconds
// setInterval(() => {
//   console.log("ordersDb:\n", ordersDb)
// }, 5000)

async function startWorkers(channel) {
  try {
    for (const queue of QUEUE_NAMES) {
      await channel.assertQueue(queue, { durable: true })

      channel.consume(queue, async (msg) => {
        const order = JSON.parse(msg.content.toString())

        order.status = "PREPARING"
        order.assignedTo = queue
        console.log(`Preparing order ${order._id} by ${queue}`)
        io.emit("ORDER_PREPARING", order)
        // Process the order
        const completedDish = await prepareDish(order)
        io.emit("ORDER_COMPLETED", order)

        const db = getDb()
        db.collection("orders").updateOne(
          query = { "_id": new ObjectId(completedDish._id) },
          update = { "$set": { status: completedDish.status, updatedAt: completedDish.updatedAt, assignedTo: completedDish.assignedTo } },
          function(err, res) {
            if (err) throw err
            console.log(`Order ${completedDish._id} updated in Database!`, res)
          }
        )
        channel.ack(msg)
      })
      console.log("Chef is listening for orders from their queue: ", queue)
    }

  } catch (error) {
    console.error("Error starting the workers", error)
  }
}
