export('Commit');
var {command} = require('ringo/subprocess');
var {format} = require('ringo/utils/strings');

function Commit(properties) {
    if (properties instanceof Object) {
        this.sha = properties.sha;
        this.user = properties.user;
        this.project = properties.project;
        this.projectPath = properties.projectPath;
    }
    return this;
}

Commit.prototype.url = function () {
    return format('http://github.com/{}/{}/commit/{}',
            this.user, this.project, this.sha);
};

Commit.prototype.author = function () {
    return this.rawCommit().match(/(Author:\s+.*)/)[1].split(/:\s+/)[1];
};

Commit.prototype.committedAt = function () {
    return this.rawCommit().match(/(Date:\s+.*)/)[1].split(/:\s+/)[1];
};

Commit.prototype.message = function () {
    return this.rawCommit().split('\n\n')[1].trim();
};

Commit.prototype.rawCommit = function () {
    if (!this.rawCommitValue) {
        this.rawCommitValue = command('git show ' + this.sha, {
            dir: this.projectPath
        });
    }
    return this.rawCommitValue;
};
