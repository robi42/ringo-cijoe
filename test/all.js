var assert = require('assert'),
    fs = require('fs');
var {Build} = require('ringo/cijoe/build');

const SHA = 'a1a1420ad0a42f2a348c',
      USER = 'ringo',
      PROJECT = 'ringojs',
      PROJECT_PATH = require('ringo/engine').getRingoHome().path,
      DUMP_PATH = module.resolve('cijoe-dump-test.json');

var build = new Build({
    sha: SHA,
    user: USER,
    project: PROJECT,
    projectPath: PROJECT_PATH,
    pid: parseInt(Math.random() * 1000)
});
var commit = build.commit();

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
    assert.strictEqual(SHA.substring(0, 7), build.shortSha());
    assert.isTrue(typeof build.startedAt === 'number');
    assert.isUndefined(build.finishedAt);
    assert.isTrue(build.building());
    assert.strictEqual('building', build.getStatus());
}

exports.tearDown = function () {
    if (fs.exists(DUMP_PATH)) {
        fs.remove(DUMP_PATH);
    }
};

exports['test `build` and corresponding `commit` objects'] = function () {
    doAssert();
};

exports['test serializing `build/commit` objects'] = function () {
    build.dump(DUMP_PATH);
    build = Build.load(DUMP_PATH, PROJECT_PATH);
    commit = build.commit();
    doAssert();
};

if (require.main == module.id) {
    require('test').run(exports);
}
