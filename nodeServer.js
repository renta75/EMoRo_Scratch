
var SerialPort = require('SerialPort');
const Readline = require('@serialport/parser-readline');

var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

var app = require('http').createServer();
var io = require('socket.io')(app);
app.listen(8080);

//defaults
var portName = "COM3";
var currentPort = null;
var baudRate = 9600;
var allPorts = [];

const net = require('net');

const PIPE_NAME = 'PipesOfPiece';
const PIPE_PATH = '\\\\.\\pipe\\';
var c=null;

const server = net.createServer((c) => {
  
  console.log('pipe client connected');
  c.on('end', () => {
    console.log('pipe client disconnected');
  });
  c.on('data', function(data) {
    console.log('Pipe server: on data:', data.toString());
    if(data.toString().includes("query bluetooth"))
    {
        if(btSerial && btSerial.isOpen()) c.write("bluetooth open\r\n");
        else c.write("bluetooth closed\r\n");
    }
    else if (data.toString().includes("query serial")){
        if (currentPort && currentPort.isOpen) c.write("serial open\r\n");
        else c.write("serial closed\r\n");
    }
    else{
        c.write("nothing\r\n")
    }
  });
});
server.on('error', (err) => {
  throw err;
});
server.listen((PIPE_PATH+PIPE_NAME), () => {
  console.log('pipe server bound');
});
server.on('data',(data)=>{
    console.log(data);
});



io.on('connection', function (socket) {

    
    socket.on('stop', function (data) {
        if(btSerial && btSerial.isOpen()) btSerial.close();
        if (currentPort && currentPort.isOpen) currentPort.close();
    });

    socket.on('start', function (data) {

        btSerial.on('found', function (address, name) {
            btSerial.findSerialPortChannel(address, function (channel) {
                btSerial.connect(address, channel, function () {
                    console.log('Bluetooth connected' + address + " " + channel);

                }, function () {
                    console.log('Bluetooth cannot connect');
                });

            }, function () {
                console.log('Bluetooth found nothing');
            });
        });

        btSerial.on('closed', function () {
            console.log("Bluetooth port closed!");
            io.emit("portDisconnected");
            refreshBlueTooth();

        });

        function refreshBlueTooth() {
            btSerial.inquireSync();
        };


        socket.emit("socketConnected");
        refreshBlueTooth();




        refreshAvailablePorts(function (_allPorts, _portName, _baudRate) {
            changePort(_portName, _baudRate);
        });

        socket.on('initPort', function (data) {
            refreshAvailablePorts(function () {
                var _portName = data.portName || portName;
                var _baudRate = data.baudRate || baudRate;
                if (!checkThatPortExists(_portName)) return;
                changePort(_portName, _baudRate);
            });
        });

        socket.on('dataOut', function (data) {
            io.emit('dataSent', data);
            console.log("Sending data: " + data);
            if (!currentPort) {
                socket.emit("errorMsg", { error: "no port currently connected" });
                return;
            }
            currentPort.write(Buffer.from(data), function (err, res) {
                if (err) onPortError(err);
            });
            btSerial.write(Buffer.from(data), function (err, bytesWritten) {
                if (err) console.log(err);
            });
        });

        socket.on('flush', function () {
            if (currentPort) currentPort.flush(function () {
                console.log("port " + portName + " flushed");
            });
        });

        socket.on('refreshPorts', function () {
            // console.log("refreshing ports list");
            refreshAvailablePorts();
        });

        socket.on('disconnectPort', function () {
            disconnectPort();
        });

        function checkThatPortExists(_portName) {
            if (allPorts.indexOf(_portName) < 0) {
                onPortError("no available port called " + _portName);
                return false;
            }
            return true;
        }

        function refreshAvailablePorts(callback) {
            var _allPorts = [];
            SerialPort.list(function (err, ports) {
                ports.forEach(function (port) {
                    _allPorts.push(port.comName);
                });

                allPorts = _allPorts;

                if (!portName && _allPorts.length > 0) portName = _allPorts[0];
                if (callback) callback(allPorts, portName, baudRate);

                io.emit('connected', {
                    baudRate: baudRate,
                    portName: portName,
                    availablePorts: _allPorts
                });
            });
        }

        function initPort(_portName, _baudRate) {

            console.log("initing port " + _portName + " at " + _baudRate);
            var port = new SerialPort(_portName, {
                baudRate: parseInt(_baudRate),
                autoOpen: false
                //       parser: SerialPort.parsers.raw
            });

            port.open(function (error) {
                if (error) {
                    onPortError(error);
                    // currentPort = null;
                    return;
                }
                onPortOpen(_portName, _baudRate);
                port.on('error', onPortError);
                port.on('close', onPortClosed);
            });

            const parser = port.pipe(new Readline({ delimiter: '\n' }));
            parser.on('data', onParserData);


            return port;
        }

        function disconnectPort(callback) {
            if (currentPort && currentPort.isOpen) {
                var oldBaud = baudRate;
                var oldName = portName;
                console.log("disconnecting port " + oldName + " at " + oldBaud);
                currentPort.on('close', function () {
                    io.emit("portDisconnected", { baudRate: oldBaud, portName: oldName });
                    if (callback) callback();
                });
                currentPort.close(function (error) {
                    if (error) {
                        onPortError(error);
                        return null;
                    }

                });
            } else if (callback) callback();
        }

        function changePort(_portName, _baudRate) {
            console.log("change");
            if (!_portName) {
                onPortError("no port name specified");
                return null;
            }
            if (!_baudRate) _baudRate = baudRate;
            disconnectPort(function () {
                currentPort = initPort(_portName, _baudRate);
                portName = _portName;
                baudRate = _baudRate;
            });
        }

        function onPortOpen(name, baud) {
            console.log("connected to port " + name + " at " + baud);
            io.emit("portConnected", { baudRate: baud, portName: name });
        }

        function onParserData(data) {
            console.log(data)
            io.emit('dataIn', data);
        }

        function onPortError(error) {
            console.log("Serial port error " + error);
            io.emit("errorMsg", { error: String(error) });
        }

        function onPortClosed() {
            console.log("Serial port closed! ");
            io.emit("portDisconnected");
            initPort(portName, baudRate);
        }

        var dataBuffer = "";
        btSerial.on('data', function (buffer) {
            dataBuffer += buffer.toString();

            if (dataBuffer.substr(dataBuffer.length - 1, 1) == '\n') {
                io.emit('dataIn', dataBuffer.toString());
                console.log(dataBuffer);
                dataBuffer = "";
            }
        });

    });

});






