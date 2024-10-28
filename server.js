const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());

// post Request
app.post("/sendMessage", async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const db = await connectDB();
    const usersCollection = db.collection("users"); 
    const messagesCollection = db.collection("messages"); 

    // Validate IDs
    const sender = await usersCollection.findOne({ _id: senderId });
    const receiver = await usersCollection.findOne({ _id: receiverId });

    if (!sender || !receiver) {
      return res.status(400).json({ error: "Invalid sender or receiver ID." });
    }

    // Save the message
    const savedMessage = await messagesCollection.insertOne({
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
    });

    // Emit the message
    io.emit("receiveMessage", savedMessage);

    // Return the saved message
    res.status(200).json(savedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Error sending message." });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// get request
app.get("/messages", async (req, res) => {
  const { senderId, receiverId } = req.query;
  try {
    const db = await connectDB();
    const messagesCollection = db.collection("messages");

    const messages = await messagesCollection
      .find({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages" });
  }
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
