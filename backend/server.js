const port = 3000
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken')
const { db } = require('./utils/util');

app.use(bodyParser.json());
app.get('/',(req, res) => {res.send('WeShare is listening!')})

app.use('/static', express.static(path.join(__dirname, 'static')));

app.use(cors());
const { rateLimiter } = require('./utils/redis');
app.use(rateLimiter);

const user_route = require('./routes/userRoute');
app.use('/users',user_route);

const chat_route = require('./routes/chatRoute');
app.use('/chats',chat_route);

const item_route = require('./routes/itemRoute');
app.use('/items',item_route);

const order_route = require('./routes/orderRoute');
app.use('/orders', order_route);

const event_route = require('./routes/eventRoute');
app.use('/events', event_route);

const fan_route = require('./routes/fanRoute');
app.use('/fans', fan_route);

const server = http.createServer(app); // Create an HTTP server

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.use((socket, next) => {
      const token = socket.handshake.headers.authorization
      console.log("socket test token:",token)
      if (!token || !token.startsWith('Bearer ')) {
        console.log("No token provided")
      	return { error: 'No token provided' };
      }
      try {
	      const accessToken = token.split(' ')[1];
        // 'WeShare' 之後要移去.env
        const decoded = jwt.verify(accessToken, 'WeShare');
        console.log("Decoded:",decoded)
        next();
      } catch (error) {
        console.log("error:",error)
        return { error: 'Invalid token' };
      }
})

io.on("connection", (socket) => {
  socket.on("message", async (msg) => {
    const accessToken = socket.handshake.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(accessToken, 'WeShare');
    const room_ID = decoded.id > msg.id ? `${msg.id}${decoded.id}` : `${decoded.id}${msg.id}`
    socket.join(`chat${room_ID}`)
    console.log(`chat${room_ID}`)
    try {
    	const sql = "INSERT INTO chat (sender_id, receiver_id, message) VALUES (?, ?, ?)"
    	const [results] = await db.query(sql, [decoded.id,msg.id,msg.message])
    	const data = {
    		id: results.insertId,
        message: msg.message,
        user: {
          id:decoded.id
        }
    	}
    	io.to(`chat${room_ID}`).emit("response",data)
      console.log("Send success")
    } catch (err) {
	    console.error(err)
    }
  })
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
// io.listen(server); // 让 Socket.IO 监听现有的 HTTP 服务器

module.exports = server;
