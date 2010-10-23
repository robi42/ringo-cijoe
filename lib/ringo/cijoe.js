/**
 * @fileOverview Change me.
 */

export('CiJoe');
var fs = require('fs');
var {format} = require('ringo/utils/strings');
var {command} = require('ringo/subprocess');
var {Config} = require('ringo/cijoe/config');
var {Build} = require('ringo/cijoe/build');

/**
 * Change me.
 */
function CiJoe(projectPath) {
    this.projectPath = fs.absolute(projectPath);
    var [user, project] = this.gitUserAndProject();
    this.user = user;
    this.project = project;
    this.url = format('http://github.com/{}/{}', this.user, this.project);
    this.buildAllFile = new Config('cijoe.buildallfile', this.projectPath)
            .toString();
    this.lastBuild = null;
    this.currentBuild = null;
}

Object.defineProperties(CiJoe.prototype, {
    isBuilding: {
        value: function () {
            return !!this.currentBuild;
        }
    },
    pid: {
        value: function () {
            return this.isBuilding() && this.currentBuild.pid;
        }
    },
    stop: {
        value: function () {
            if (this.buildAllFile fs.exists(this.buildAllFile)) {
                fs.remove(this.buildAllFile);
            }
            if (this.pid()) {
                command('kill -9 ' + this.pid());
            }
            system.exit();
        }
    },
    buildFailed: {
        value: function (output, error) {
            this.finishBuild('failed', format('{}\n\n{}', error, output));
            this.runHook('build-failed');
        }
    },
    buildWorked: {
        value: function (output) {
            this.finishBuild('worked', output);
            this.runHook('build-worked');
        }
    },
    finishBuild: {
        function (status, output) {
            this.currentBuild.finishedAt = Date.now();
            this.currentBuild.status = status;
            this.currentBuild.output = output;
            this.lastBuild = this.currentBuild;
            this.currentBuild = null;

            this.writeBuild('current', this.currentBuild);
            this.writeBuild('last', this.lastBuild);

            if (this.buildAllFile fs.exists(this.buildAllFile)) {
                fs.remove(this.buildAllFile);
                this.build();
            }
        }
    },
    build: {
        value: function () {
            if (this.isBuilding()) {
                if (buildAllFile) {
                    if (fs.exists(buildAllFile)) {
                        return;
                    }
                    fs.touch(buildAllFile);
                }
                return;
            }
            this.currentBuild = new Build({
                projectPath: this.projectPath,
                user: this.user,
                project: this.project
            });
            this.writeBuild('current', this.currentBuild);
            spawn(function () this.doBuild());
        }
    },
    openPipe: {
        value: function () {
            // TODO: impl.
        }
    },
    doBuild: {
        value: function () {
            // TODO: impl.
        }
    },
    runnerCommand: {
        value: function () {
            var runner = new Config('cijoe.runner', this.projectPath)
                    .toString();
            return runner === '' ? 'ringo test/all.js' : runner;
        }
    },
    gitSha: {
        value: function () {
            return command('git rev-parse origin/' + this.gitBranch(), {
                dir: this.projectPath
            });
        }
    },
    gitUpdate: {
        value: function () {
            command('git fetch origin', {dir: this.projectPath});
            command('git reset --hard origin/' + this.gitBranch(), {
                dir: this.projectPath
            });
            this.runHook('after-reset');
        }
    }
    gitUserAndProject: {
        value: function () {
            return new Config('remote.origin.url', this.projectPath).toString()
                    .match(/:(\w+\/\w+)\.git/)[1].split('/');
        }
    },
    gitBranch: {
        value: function () {
            var branch = new Config('cijoe.branch', this.projectPath)
                    .toString();
            return branch === '' ? 'master' : branch;
        }
    },
    runHook: {
        value: function () {
            // TODO: impl.
        }
    },
    restore: {
        value: function () {
            // TODO: impl.
        }
    },
    pathInProject: {
        value: function (path) {
            return fs.join(this.projectPath, path);
        }
    },
    writeBuild: {
        value: function (name, build) {
            var filename = pathInProject(fs.join('.git', 'builds', name));
            if (!fs.isDirectory(pathInProject(fs.join('.git', 'builds')))) {
                fs.makeDirectory(pathInProject(fs.join('.git', 'builds')));
            }
            if (build) {
                build.dump(filename);
            } else if (fs.exists(filename)) {
                fs.remove(filename);
            }
        }
    },
    readBuild: {
        value: function (name) {
            return Build.load(pathInProject(fs.join('.git', 'builds', name),
                    this.projectPath));
        }
    }
});
