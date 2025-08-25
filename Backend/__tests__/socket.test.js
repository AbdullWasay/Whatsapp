// socket.test.js
const { Server } = require("socket.io");
const Client = require("socket.io-client");

let io, serverSocket, clientSocket;

beforeAll((done) => {
  // Start Socket.IO server
  io = new Server(4000, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    serverSocket = socket;

    // Example echo event
    socket.on("message", (msg) => {
      socket.emit("message", msg);
    });
  });

  // Connect client
  clientSocket = new Client("http://localhost:4000");
  clientSocket.on("connect", done);
});

afterAll(() => {
  io.close();
  clientSocket.close();
});

test("Client should receive message from server", (done) => {
  const testMessage = "Hello from test";

  clientSocket.on("message", (msg) => {
    expect(msg).toBe(testMessage); // ✅ assertion
    done();
  });

  clientSocket.emit("message", testMessage);
});
