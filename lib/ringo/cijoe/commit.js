export('Commit');
var {command} = require('ringo/subprocess');
var {format} = require('ringo/utils/strings');

var propertyNames = ['sha', 'user', 'project', 'projectPath'];

function Commit(properties) {
    if (properties instanceof Object) {
        for (let [name, value] in properties) {
            if (propertyNames.indexOf(name) !== -1) {
                this[name] = value;
            }
        }
    }
    return this;
}

Object.defineProperties(Commit.prototype, {
    url: {
        value: function () {
            return format('http://github.com/{}/{}/commit/{}',
                    this.user, this.project, this.sha);
        }
    },
    author: {
        value: function () this.rawCommit().match(/Author:\s+(.*)/)[1]
    },
    committedAt: {
        value: function () this.rawCommit().match(/Date:\s+(.*)/)[1]
    },
    message: {
        value: function () this.rawCommit().split('\n\n')[1].trim()
    },
    rawCommit: {
        value: function () {
            if (!this.rawCommitValue) {
                this.rawCommitValue = command('git show ' + this.sha, {
                    dir: this.projectPath
                });
            }
            return this.rawCommitValue;
        }
    }
});
