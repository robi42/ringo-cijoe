export('Build');
var fs = require('fs');
var {Commit} = require('ringo/cijoe/commit');

function Build(properties) {
    if (properties instanceof Object) {
        this.projectPath = properties.projectPath;
        this.user = properties.user;
        this.project = properties.project;
        this.startedAt = properties.startedAt;
        this.finishedAt = properties.finishedAt;
        this.sha = properties.sha;
        this.status = properties.status;
        this.output = properties.output;
        this.pid = properties.pid;
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
        this.commitInstance = this.commitInstance ||
                new Commit(this.sha, this.user, this.project, this.projectPath);
    }
};

Build.prototype.dump = function (file) {
    var config = [
        this.user, this.project, this.startedAt, this.finishedAt,
        this.sha, this.status, this.output, this.pid
    ];
    var data = JSON.stringify(config);
    fs.write(file, data);
};

Build.load = function (file, projectPath) {
    if (fs.exists(file)) {
        return JSON.parse(fs.read(file)).unshift(projectPath);
    }
};
