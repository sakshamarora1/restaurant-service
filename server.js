const express = require("express")

const app = express()
const port = 3000

// Middleware
app.use(express.json())

// In-memory orders list, Replace later with DB
const orders = []

// Route to accept orders
app.post("/order", async (req, res) => {
  try {
    const { dish, specialInstructions } = req.body
    if (!dish) {
      return res.status(400).json({ error: "Dish name is required." })
    }

    const order = {
      dish,
      specialInstructions,
      status: "PENDING",
      createdAt: new Date().toLocaleString()
    }
    console.log("Waiter receiving: ", order)

    await new Promise(resolve => setTimeout(resolve, 2000))

    order.status = "TAKEN"

    orders.push(order)
    console.log("New Order: ", order)
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
