var assert = require('assert');
var {Build} = require('ringo/cijoe/build');

const SHA = 'a1a1420ad0a42f2a348c',
      USER = 'ringo',
      PROJECT = 'ringojs';

var build = new Build({
    sha: SHA,
    user: USER,
    project: PROJECT,
    projectPath: require('ringo/engine').getRingoHome().path,
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

exports['test `build` and corresponding `commit` objects'] = function () {
    doAssert();
};

exports['test serializing `build/commit` objects'] = function () {
    var dumpPath = module.resolve('cijoe-dump-test.json'),
        projectPath = build.projectPath;

    build.dump(dumpPath);
    build = Build.load(dumpPath, projectPath);
    commit = build.commit();

    doAssert();
    require('fs').remove(dumpPath);
};

if (require.main == module.id) {
    require('test').run(exports);
}
