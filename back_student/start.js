// Start wrapper - waits for DB port then starts the compiled app
const net = require('net');
const util = require('util');

function masked(val) {
  if (!val) return '';
  if (val.length <= 4) return '****';
  return val.slice(0,2) + '****' + val.slice(-2);
}

function waitForPort(host, port, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryConnect() {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve();
      });
      socket.on('error', (err) => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) return reject(err);
        setTimeout(tryConnect, 1000);
      });
    }
    tryConnect();
  });
}

(async function main(){
  try {
    console.info('Container environment snapshot:');
    console.info(' DB_HOST=', process.env.DB_HOST);
    console.info(' DB_PORT=', process.env.DB_PORT);
    console.info(' DB_USER=', process.env.DB_USER);
    console.info(' DB_NAME=', process.env.DB_NAME);
    console.info(' JWT_SECRET=', masked(process.env.JWT_SECRET));

    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT || 3306);
    console.info(`Waiting for DB ${host}:${port} to be reachable...`);
    await waitForPort(host, port, 60000).catch((e)=>{
      console.warn('DB port check failed (timed out); continuing to start application - TypeORM will attempt to connect directly.');
    });

    // Load the built app
    require('./build/index.js');
  } catch (err) {
    console.error('Startup wrapper failed:', err && err.stack || err);
    process.exit(1);
  }
})();

