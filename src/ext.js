
const io=require("socket.io-client");
const socket=io.connect('http://localhost:8080');
socket.emit("start");


module.exports = {
  
  _shutdown: function() {
    if(socket)
    {
      socket.emit("stop");  
    }
    
  },

  _getStatus: function() {
    if (socket)
    {
      if(socket.connected)
      {
        return {status: 2, msg: 'Ready'};
      }
      else{
        return {status: 0, msg: 'Server not connected'};
      }
    }
    else return {status: 0, msg: 'Server not connected'};
  },

 
  write_io: function(port, value)
  {
    if (socket) {
      socket.emit("dataOut", "write_io,"+port+","+value +"\n");
    }
  },

  read_io: function(port, callback)
  {
    if (socket) {
      socket.emit("dataOut", "read_io,"+port+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  read_adc: function(port, callback)
  {
    if (socket) {
      socket.emit("dataOut", "read_adc,"+port+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  servo: function(port, value)
  {
    if (socket) {
      socket.emit("dataOut", "servo,"+port+","+value +"\n");
    }
  },

  temperature: function(port, callback)
  {
    if (socket) {
      socket.emit("dataOut", "temperature,"+port+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  ultrasound: function(port, callback)
  {
    if (socket) {
      socket.emit("dataOut", "ultrasound,"+port+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  tone: function(freq, duration)
  {

    if (socket) {
      socket.emit("dataOut", "tone,"+freq+","+duration+"\n");
    }
  },

  display: function(value)
  {

    if (socket) {
      socket.emit("dataOut", "display,"+value+"\n");
    }
  },

  cursor: function(row, position)
  {
    if (socket) {
      socket.emit("dataOut", "cursor,"+row+","+position +"\n");
    }
  },
  compass: function(callback)
  {
    if (socket) {
      socket.emit("dataOut", "compass\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  gyroscope: function(axis,callback)
  {
    if (socket) {
      socket.emit("dataOut", "gyroscope,"+axis+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  gyroscope_init: function()
  {
    if (socket) {
      socket.emit("dataOut", "gyroscope_init\n");
    }
  },

  gyroscope_reset: function()
  {
    if (socket) {
      socket.emit("dataOut", "gyroscope_reset\n");
    }
  },

  acceleration: function(axis,callback)
  {
    if (socket) {
      socket.emit("dataOut", "acceleration,"+axis+"\n");
      socket.on("dataIn", function(data) {
        callback(data);
      });
    }
  },

  bluetooth_write: function(value)
  {
      return 0;
  },

  bluetooth_read: function()
  {
      return "some value";
  },
};
