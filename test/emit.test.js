const sdk = require('../lib/index');
const assert = require('assert');
var https = require('https');
var fs = require('fs');


var requests = [];

var host = 'localhost';
var port = 1234;
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var server = https.createServer({
    key: fs.readFileSync('test/server-key.pem'),
    cert: fs.readFileSync('test/server-crt.pem'),
    ca: fs.readFileSync('test/ca-crt.pem')
}, function (req, res) {
    requests.push(req);
    res.writeHead(200);
    res.end();
});

beforeEach(function (done) {
    server.listen(port);
    sdk(host, port, {ca: 'test/ca-crt.pem'}).emitter("test").emit("topic", {foo: "barrr"}, function (reason) {
        console.log("err", reason);
        done()
    });
});

afterEach(function () {
    server.close();
});

describe('emitter', function () {
    describe('#emit()', function () {
        it('should send the expected http request', function () {
            assert(requests.length === 1);
            const gotHeaders = requests[0].headers;
            assert(gotHeaders['content-type'] === 'application/json');
            assert(gotHeaders['x-event-content-type'] === 'application/json');
            assert(gotHeaders['x-cloud-events-version'] === '0.1');
            assert(gotHeaders['x-event-type'] === 'topic');
            assert(gotHeaders['x-source-id'] === 'test');
        });
    });
});
