const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const http = require('http');
const server = http.createServer(app);
const WebSocket = require("ws");
// const SocketIoServer = require('socket.io').Server;
const { Deepgram } = require('@deepgram/sdk');

const io = require('socket.io')(server,{
  cors: {
    origin: '*',
  }
});


function handle_connection(socket) {

  const deepgram = new Deepgram("8cd1cc5cae7a2145b1a4bed741f47b8887feac2d");

  const dgSocket = deepgram.transcription.live({
    punctuate: true
  });

  dgSocket.addListener("open", () => {
    console.log('sending recording permission')
    socket.emit("can-open-mic")
  });

  socket.on("microphone-stream", (stream) => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.send(stream);
      console.log('sent data to deep');
    }
  });

  dgSocket.addListener("transcriptReceived", (transcription) => {
    console.log('transcription recieved');
    io.emit("transcript-result", socket.id, transcription);
  });

  socket.on("stopRecording", () => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.finish();
    }
  });
}

io.on("connection", (socket) => {
  console.log('Client Connected');
  handle_connection(socket)
});


server.listen(5000,() => {
  console.log('Server listening at port 5000')
});


