'use strict';

const Hapi = require('@hapi/hapi');
const filepaths = require('filepaths');
const hapiBoomDecorators = require('hapi-boom-decorators');
const hapiInert = require('@hapi/inert');
const Path = require('path');

const config = require('../config');

async function createServer() {
    const server = await new Hapi.server({
        port: 5000,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname + '\\..')
            }
        }
    });

    await server.register([
        hapiBoomDecorators,
        hapiInert
    ]);

    let routes = filepaths.getSync(__dirname + '\\routes\\');
    for(let route of routes)
        server.route( require(route.substr(2)) );

    try {
        await server.start();
        console.log(`Server running at: ${server.info.uri}`);
    } catch(err) {
        console.log(JSON.stringify(err));
    }

    return server;
}

module.exports = createServer;