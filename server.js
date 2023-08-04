const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const { connectToDatabase, getDb, ObjectId } = require("./db")

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

// In-memory worker/chef queue
const orderQueue = []

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

    orderQueue.push(order)
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
    await connectToDatabase();
    console.log(`Server is running on http://localhost:${port}`)
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
})

async function prepareDish(order) {
  await new Promise(resolve => setTimeout(resolve, 4000))
  order.status = "COMPLETED"
  order.updatedAt = new Date().toLocaleString()
  io.emit("ORDER_COMPLETED", order)
  console.log(`Dish: ${order.dish} with _id: ${order._id} is Completed! (${order.updatedAt})`)
  return order
}

async function prepareDishes() {
  if (orderQueue.length > 0) {
    const newOrders = orderQueue.filter(order => order.status === "TAKEN")
    if (newOrders.length > 0) {
      console.log("Current worker queue length: ", newOrders.length)
      // const order = orderQueue.shift()
      const completedDishes = await prepareDishesConcurrently(newOrders)

      const db = getDb()
      completedDishes.forEach(completedDish => {
        // const index = ordersDb.findIndex(order => order._id === completedDish._id)
        // if (index !== -1) {
        //   ordersDb[index] = completedDish
        // }
        db.collection("orders").updateOne(
          query = { "_id": new ObjectId(completedDish._id) },
          update = { "$set": { status: completedDish.status, updatedAt: completedDish.updatedAt } },
          function(err, res) {
            if (err) throw err
            console.log(`Order ${completedDish._id} updated in Database!`, res)
          }
        )
      })
      // ordersDb.push(...completedDishes)
    }
  }
}

async function prepareDishesConcurrently(newOrders) {
  newOrders.forEach(newOrder => {
    const index = orderQueue.findIndex(order => order._id === newOrder._id)
    orderQueue[index].status = "PREPARING"
    io.emit("ORDER_PREPARING", orderQueue[index])
  })
  const preparedOrders = await Promise.all(newOrders.map(prepareDish))
  preparedOrders.forEach(preparedOrder => {
    const index = orderQueue.findIndex(order => order._id === preparedOrder._id)
    if (index !== -1) {
      orderQueue.splice(index, 1)
    }
  })
  return preparedOrders
}

// Check for new orders every second
setInterval(() => {
  prepareDishes().catch(error => console.error("Worker error: " + error))
}, 1000)

// Log OrdersDb snapshot every 5 seconds
// setInterval(() => {
//   console.log("ordersDb:\n", ordersDb)
// }, 5000)
