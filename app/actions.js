var {Response} = require('ringo/webapp/response');
var {CiJoe} = require('ringo/cijoe');
var arrays = require('ringo/utils/arrays');

var joe = new CiJoe(arrays.peek(system.args));

exports.ping = {
    GET: function (req) {
        if (joe.isBuilding() || !joe.lastBuild || !joe.lastBuild.worked()) {
            return {
                status: 412,
                headers: {'Content-Type': 'text/plain'},
                body: [
                    joe.isBuilding() || joe.lastBuild === null ?
                            'building' : joe.lastBuild.sha
                ]
            }
        }
        return new Response(joe.lastBuild.sha);
    }
};
