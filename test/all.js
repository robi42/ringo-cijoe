var assert = require('assert');
var {Build} = require('ringo/cijoe/build');

const SHA = 'a1a1420ad0a42f2a348c',
      USER = 'ringo',
      PROJECT = 'ringojs';

exports['test `build` and corresponding `commit` objects'] = function () {
    var build = new Build({
        sha: SHA,
        user: USER,
        project: PROJECT,
        projectPath: require('ringo/engine').getRingoHome().path,
        pid: parseInt(Math.random() * 1000)
    });
    var commit = build.commit();

    assert.isNotNull(build);
    assert.isNotNull(commit);
    assert.strictEqual(
        'http://github.com/' + USER + '/' + PROJECT + '/commit/' + SHA,
        commit.url()
    );
    assert.strictEqual(SHA.substring(0, 7), build.shortSha());
};

if (require.main == module.id) {
    require('test').run(exports);
}
