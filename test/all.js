var assert = require('assert'),
    fs = require('fs');
var {Build} = require('../lib/ringo/cijoe/build');
var {Config} = require('../lib/ringo/cijoe/config');
var {CiJoe} = require('../lib/main');
var system = require('system');

const SHA = 'a1a1420ad0a42f2a348c',
      USER = 'ringo',
      PROJECT = 'ringojs',
      PROJECT_PATH = require('ringo/engine').getRingoHome().path,
      DUMP_TEST_PATH = module.resolve('cijoe-dump-test.json');

var build = new Build({
    sha: SHA,
    user: USER,
    project: PROJECT,
    projectPath: PROJECT_PATH,
});
var commit = build.commit;

function doAssert() {
    assert.isNotNull(build);
    assert.isNotNull(commit);
    assert.strictEqual(
        'http://github.com/' + USER + '/' + PROJECT + '/commit/' + SHA,
        commit.url()
    );
    assert.matches(commit.author(), /Hannes/);
    assert.matches(commit.message(), /Rhino/);
    assert.matches(commit.committedAt(), /2010/);
    assert.strictEqual(SHA.substring(0, 7), build.shortSha);
    assert.isTrue(typeof build.startedAt === 'number');
    assert.isUndefined(build.finishedAt);
    assert.isTrue(build.building());
    assert.strictEqual('building', build.getStatus());
}

exports.tearDown = function () {
    if (fs.exists(DUMP_TEST_PATH)) {
        fs.remove(DUMP_TEST_PATH);
    }
};

exports['test `build` and corresponding `commit` objects'] = function () {
    doAssert();
};

exports['test serializing `build/commit` objects'] = function () {
    build.dump(DUMP_TEST_PATH);
    build = Build.load(DUMP_TEST_PATH, PROJECT_PATH);
    commit = build.commit;
    doAssert();
};

exports['test `config` objects'] = function () {
    assert.isNotNull(new Config('user.name').toString());
    assert.isNotNull(new Config('name', PROJECT_PATH, new Config('user'))
            .toString());
    assert['throws'](function () new Config('--invalid').toString());
};

exports['test actual building'] = function () {
    var joe = new CiJoe(PROJECT_PATH);
    assert.isTrue(joe.build());
    var lastBuildDumpPath = fs.join(PROJECT_PATH, '.git', 'builds', 'last'),
        lastBuildDumpLoad = JSON.parse(fs.read(lastBuildDumpPath));
    assert.isTrue(fs.exists(lastBuildDumpPath));
    assert.strictEqual('worked', lastBuildDumpLoad.status);
    assert.strictEqual('worked', joe.lastBuild.status);
};

if (require.main == module.id) {
    system.exit(require('test').run(exports));
}
