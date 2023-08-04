// const { ObjectId } = require("./db")

async function prepareDish(order) {
  await new Promise(resolve => setTimeout(resolve, 4000))
  order.status = "COMPLETED"
  order.updatedAt = new Date().toLocaleString()
  console.log(`Dish: ${order.dish} with _id: ${order._id} is Completed! (${order.updatedAt})`)
  return order
}

module.exports = {
  prepareDish
}

// async function prepareDish(order) {
//     await new Promise(resolve => setTimeout(resolve, 4000))
//     order.status = "COMPLETED"
//     order.updatedAt = new Date().toLocaleString()
//     io.emit("ORDER_COMPLETED", order)
//     console.log(`Dish: ${order.dish} with _id: ${order._id} is Completed! (${order.updatedAt})`)
//     return order
//   }

//   async function prepareDishes() {
//     if (orderQueue.length > 0) {
//       const newOrders = orderQueue.filter(order => order.status === "TAKEN")
//       if (newOrders.length > 0) {
//         console.log("Current worker queue length: ", newOrders.length)
//         // const order = orderQueue.shift()
//         const completedDishes = await prepareDishesConcurrently(newOrders)

//         const db = getDb()
//         completedDishes.forEach(completedDish => {
//           // const index = ordersDb.findIndex(order => order._id === completedDish._id)
//           // if (index !== -1) {
//           //   ordersDb[index] = completedDish
//           // }
//           db.collection("orders").updateOne(
//             query = { "_id": new ObjectId(completedDish._id) },
//             update = { "$set": { status: completedDish.status, updatedAt: completedDish.updatedAt } },
//             function(err, res) {
//               if (err) throw err
//               console.log(`Order ${completedDish._id} updated in Database!`, res)
//             }
//           )
//         })
//         // ordersDb.push(...completedDishes)
//       }
//     }
//   }

//   async function prepareDishesConcurrently(newOrders) {
//     newOrders.forEach(newOrder => {
//       const index = orderQueue.findIndex(order => order._id === newOrder._id)
//       orderQueue[index].status = "PREPARING"
//       io.emit("ORDER_PREPARING", orderQueue[index])
//     })
//     const preparedOrders = await Promise.all(newOrders.map(prepareDish))
//     preparedOrders.forEach(preparedOrder => {
//       const index = orderQueue.findIndex(order => order._id === preparedOrder._id)
//       if (index !== -1) {
//         orderQueue.splice(index, 1)
//       }
//     })
//     return preparedOrders
//   }