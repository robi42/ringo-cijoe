export('Build');
var fs = require('fs');
var {Commit} = require('ringo/cijoe/commit');

var propertyNames = ['projectPath', 'user', 'project', 'startedAt',
        'finishedAt', 'sha', 'status', 'output', 'pid'];

function Build(properties) {
    if (properties instanceof Object) {
        for (let [name, value] in properties) {
            if (propertyNames.indexOf(name) !== -1) {
                this[name] = value;
            }
        }
    }
    this.startedAt = this.startedAt || new Date();
    return this;
}

Build.prototype.getStatus = function () {
    return this.startedAt && this.finishedAt ? this.status : 'building';
};

Build.prototype.failed = function () {
    return this.getStatus() === 'failed';
};

Build.prototype.worked = function () {
    return this.getStatus() === 'worked';
};

Build.prototype.building = function () {
    return this.getStatus() === 'building';
};

Build.prototype.duration = function () {
    if (!this.building()) {
        return this.finishedAt - this.startedAt;
    }
};

Build.prototype.shortSha = function () {
    return this.sha ? this.sha.substring(0, 7) : '<unknown>';
};

Build.prototype.cleanOutput = function () {
    return this.output.replace(/\e\[.+?m/g, '').trim();
};

Build.prototype.envOutput = function () {
    var out = this.cleanOutput();
    return out.length > 100000 ? out.substring(-100000, 100000) : out;
};

Build.prototype.commit = function () {
    if (this.sha != null) {
        this.lastCommit = this.lastCommit || new Commit({
            sha: this.sha, user: this.user, project: this.project,
            projectPath: this.projectPath
        });
        return this.lastCommit;
    }
};

Build.prototype.dump = function (filePath) {
    var config = {
        user: this.user, project: this.project, startedAt: this.startedAt,
        finishedAt: this.finishedAt, sha: this.sha, status: this.status,
        output: this.output, pid: this.pid
    };
    var data = JSON.stringify(config);
    fs.write(filePath, data);
};

Build.load = function (filePath, projectPath) {
    if (fs.exists(filePath)) {
        var properties = JSON.parse(fs.read(filePath));
        properties.projectPath = projectPath;
        return new Build(properties);
    }
};
