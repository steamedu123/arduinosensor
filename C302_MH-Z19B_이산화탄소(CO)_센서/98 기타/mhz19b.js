
const SerialPort = require('serialport');
const internalBus = new (require('events'))();

const {
    APP_PORT,
    STORAGE_FILENAME,
    PUBLIC_PATH,
    UART_ADAPTER,
    MH_REQUEST_INTERVAL,
    MESSAGE_NAME,
} = require('./const');

const GET_CO2_REQUEST = Buffer.from([
    0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79
]);


const port = new SerialPort(
    'COM13',  {
        baudRate: 9600,
    }
);

port.on('data', onPortData);
port.on('open', onPortOpen);
port.on('error', onPortError);


function calculateCrc(buffer) {
    const sumOfBytes1to7 = buffer
        .slice(1, 8)
        .reduce((sum, intVal) => sum + intVal, 0);
    const sumWithInvertedBits = parseInt(
        sumOfBytes1to7
            .toString(2)
            .split('')
            .map(ch => ch === '1' ? '0' : '1')
            .join(''),
        2
    );
    return sumWithInvertedBits + 1;
}

function sendCO2Request() {
    console.log('sent bytes: ', GET_CO2_REQUEST);
    port.write(GET_CO2_REQUEST, function(err) {
        if (err) {
            console.log('write error: ', err);
        }
    });
}

function onPortData(buffer) {

    console.log('received bytes: ', buffer);

    const crc = calculateCrc(buffer);

    const receivedCrc = buffer[8];

    const startByte = buffer[0];
    const sensorNum = buffer[1];
    const co2HighByte = buffer[2];
    const co2LowByte = buffer[3];
    const temperatureRaw = buffer[4];

    if (startByte === 0xFF && sensorNum === 0x86) {

        if (receivedCrc === crc) {

            const ppm = (256 * co2HighByte) + co2LowByte;

            const temperature = temperatureRaw - 40;

            console.log(`measured ppm: ${ppm} and temperature: ${temperature}`);

            const timestamp = new Date();


            internalBus.emit(MESSAGE_NAME, {
                timestamp: timestamp.getTime(),
                ppm,
                temperature,
            });

        } else {

           console.log(`checksum error`);
           console.log('crc', crc);
           console.log('receivedCrc', receivedCrc);

       }

    } else {
        console.log(`unexpexted first two bytes of response`);
    }
}

function onPortOpen() {
    console.log(`serial port was opened`);
    sendCO2Request();
    setInterval(sendCO2Request, MH_REQUEST_INTERVAL);
}

function onPortError(err) {
    console.error(err);
}