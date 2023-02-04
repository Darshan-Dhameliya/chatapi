const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});
const cors = require("cors");
const users = require("./userdata.json");
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => res.send("Sever Work Fine"));

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const existingUser = users.find(
      (user) => user.room === room && user.name === name
    );

    if (existingUser) {
      return callback({ error: "Username is taken." });
    }

    socket.join(room);
    socket.emit("message", {
      user: "Bot",
      text: `${name}, welcome to room ${room}.`,
    });
    const user = { id: socket.id, name, room };
    users.push(user);

    socket.broadcast.to(room).emit("message", {
      user: "Bot",
      text: `${name} has joined!`,
    });
  });

  socket.on("sendMessage", (message, callback) => {
    const id = socket.id;
    const user = users.find((user) => user.id === id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });

  socket.on("disconnect", () => {
    const id = socket.id;
    const index = users.findIndex((user) => user.id === id);
    var leftuser;
    if (index !== -1) {
      leftuser = users.splice(index, 1)[0];
    }
    if (leftuser) {
      socket.broadcast.to(leftuser.room).emit("message", {
        user: "Bot",
        text: `${leftuser.name} has left!`,
      });
    }
  });
});

http.listen(PORT, () => console.log("server started"));
