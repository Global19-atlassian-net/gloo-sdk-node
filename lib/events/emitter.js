'use strict';
const fs = require('fs');
const https = require('https');
const isNil = require('ramda/src/isNil');
const uuidv1 = require('uuid/v1');

const contentTypeJson = 'application/json';
const contentTypeText = 'text/plain';
const cloudEventsSpecVersion = '0.1';
const eventPath = '/events';

const headerContentType = "Content-Type";
const headerXEventContentType = "X-Event-Content-Type";
const headerXCloudEventsVersion = "X-Cloud-Events-Version";
const headerXEventId = "X-Event-Id";
const headerXEventType = "X-Event-Type";
const headerXEventTime = "X-Event-Time";
const headerXSourceId = "X-Source-Id";

module.exports = function (hostname, port, ssl) {
    return function (sourceId, contentType) {
        if (
            isNil(sourceId) ||
            typeof sourceId !== 'string' ||
            sourceId === ''
        ) {
            throw new Error("emitter requires sourceId to be specified<string>")
        }
        if (
            isNil(contentType) ||
            contentType === undefined ||
            typeof contentType !== 'string' ||
            contentType === ''
        ) {
            contentType = contentTypeJson;
        }
        return {
            emit: function (topic, data, callback) {
                const event = {
                    context: {
                        contentType: contentType,
                        cloudEventsVersion: cloudEventsSpecVersion,
                        eventId: uuidv1(),
                        eventTime: new Date(),
                        eventType: topic,
                        source: {
                            id: sourceId
                        }
                    },
                    data: data
                };
                doHttpRequest(hostname, port, ssl, event, callback)
            }
        }
    };
};

function doHttpRequest(hostname, port, ssl, event, callback) {
    var data = '';
    switch (event.context.contentType) {
        case contentTypeJson:
            data = JSON.stringify(event.data);
            break;
        case contentTypeText:
            data = event.data;
            break;
        default:
            throw new Error("unsupported content type " + event.contentType);
    }
    var options = {
        hostname: hostname,
        port: port,
        path: eventPath,
        method: 'POST',
        headers: constructHeaders(event.context)
    };
    if (
        !isNil(ssl) &&
        !isNil(ssl.ca) &&
        !(ssl.ca === undefined)
    ) {
        options.ca = fs.readFileSync(ssl.ca);
    }
    if (
        !isNil(ssl) &&
        !isNil(ssl.cert) &&
        !(ssl.cert === undefined)
    ) {
        options.cert = fs.readFileSync(ssl.cert);
    }
    if (
        !isNil(ssl) &&
        !isNil(ssl.key) &&
        !(ssl.key === undefined)
    ) {
        options.key = fs.readFileSync(ssl.key);
    }

    const req = https.request(options, function (res) {
        if (res.statusCode / 100 !== 2) {
            throw new Error("request failed with status code " + res.statusCode);
        }
        callback();
    });
    req.end(data);
}

function constructHeaders(context) {
    var headers = {};
    headers[headerContentType] = context.contentType;
    headers[headerXEventContentType] = context.contentType;
    headers[headerXCloudEventsVersion] = context.cloudEventsVersion;
    headers[headerXEventId] = context.eventId;
    headers[headerXEventTime] = context.eventTime.toUTCString();
    headers[headerXEventType] = context.eventType;
    headers[headerXSourceId] = context.source.id;
    return headers
}
