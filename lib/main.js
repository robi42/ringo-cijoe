exports.CiJoe = require('./ringo/cijoe').CiJoe;


exports.initWebapp = function() {
    require("ringo/httpserver").main(module.resolve('../app/actions'));
};