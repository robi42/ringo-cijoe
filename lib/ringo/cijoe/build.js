export('Build');
var fs = require('fs');
var {Commit} = require('ringo/cijoe/commit');

var propertyNames = [
    'projectPath', 'user', 'project', 'startedAt', 'finishedAt', 'sha',
    'status', 'output', 'pid'
];

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

Object.defineProperties(Build.prototype, {
    getStatus: {
        value: function () {
            return this.startedAt && this.finishedAt ?
                    this.status : 'building';
        }
    },
    failed: {
        value: function () this.getStatus() === 'failed'
    },
    worked: {
        value: function () this.getStatus() === 'worked'
    },
    building: {
        value: function () this.getStatus() === 'building'
    },
    duration: {
        value: function () {
            if (!this.building()) {
                return this.finishedAt - this.startedAt;
            }
        }
    },
    shortSha: {
        value: function () this.sha ? this.sha.substring(0, 7) : '<unknown>'
    },
    cleanOutput: {
        value: function () this.output.replace(/\e\[.+?m/g, '').trim()
    },
    envOutput: {
        value: function () {
            var out = this.cleanOutput();
            return out.length > 100000 ?
                    out.substring(-100000, 100000) : out;
        }
    },
    commit: {
        value: function () {
            if (this.sha != null) {
                return this.lastCommit = this.lastCommit || new Commit({
                    sha: this.sha,
                    user: this.user,
                    project: this.project,
                    projectPath: this.projectPath
                });
            }
        }
    },
    dump: {
        value: function (filePath) {
            var data = {};
            for each (let name in Object.keys(this)) {
                data[name] = this[name];
            }
            fs.write(filePath, JSON.stringify(data));
        }
    }
});

Build.load = function (filePath, projectPath) {
    if (fs.exists(filePath)) {
        var properties = JSON.parse(fs.read(filePath));
        properties.projectPath = projectPath;
        return new Build(properties);
    }
};
