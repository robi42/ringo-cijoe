var {CiJoe} = require('ringo-cijoe');
var arrays = require('ringo/utils/arrays');
var response = require('ringo/jsgi/response');
var {Application} = require('stick');
var {Environment} = require('reinhardt');
var system = require('system');

var joe = joe || new CiJoe(arrays.peek(system.args));

var app = exports.app = Application();
app.configure("notfound", "static", "route");
app.static(module.resolve('./public'));

var reinhardt = new Environment({
   loader: [module.resolve('./skins/')]
})

app.get('/ping', function (req) {
  joe.restore();
  if (joe.isBuilding() || !joe.lastBuild || !joe.lastBuild.worked()) {
      return {
          status: 412,
          headers: {'Content-Type': 'text/plain'},
          body: [
              joe.isBuilding() || !joe.lastBuild ?
                      'building' : joe.lastBuild.sha
          ]
      };
  }
  return response.text(joe.lastBuild.sha);
});

app.get('/', function (req) {
     joe.restore();
     return reinhardt.renderResponse('index.html', {joe: joe});
});

app.post('/', function (req) {
  joe.restore();
  joe.build();
  return response.redirect('/');
});