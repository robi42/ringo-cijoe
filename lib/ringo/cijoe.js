/**
 * @fileOverview Contains main prototype impl.
 */

export('CiJoe');
var fs = require('fs');
var {MemoryStream, TextStream} = require('io');
var {format} = require('ringo/utils/strings');
var {command, createProcess} = require('ringo/subprocess');
var {Config} = require('ringo/cijoe/config');
var {Build} = require('ringo/cijoe/build');
var log = require('ringo/logging').getLogger(module.id);

/**
 * CiJoe constructor.
 * @param {String} projectPath the path of the project
 */
function CiJoe(projectPath) {
    this.projectPath = fs.absolute(projectPath);
    var [user, project] = this.gitUserAndProject();
    this.user = user;
    this.project = project;
    this.url = format('http://github.com/{}/{}', this.user, this.project);
    try {
        this.buildAllFile = new Config('cijoe.buildallfile', this.projectPath)
                .toString();
    } catch (error) {
        this.buildAllFile = null;
    }
    this.lastBuild = null;
    this.currentBuild = null;
    return this;
}

Object.defineProperties(CiJoe.prototype, {
    isBuilding: {
        value: function () !!this.currentBuild
    },
    process: {
        value: function () this.isBuilding() && this.currentBuild.process
    },
    stop: {
        value: function () {
            if (this.buildAllFile && fs.exists(this.buildAllFile)) {
                fs.remove(this.buildAllFile);
            }
            if (this.process()) {
                this.process().kill();
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
        value: function (status, output) {
            this.currentBuild.finishedAt = Date.now();
            this.currentBuild.status = status;
            this.currentBuild.output = output;
            this.lastBuild = this.currentBuild;
            this.currentBuild = null;

            this.writeBuild('current', this.currentBuild);
            this.writeBuild('last', this.lastBuild);

            if (this.buildAllFile && fs.exists(this.buildAllFile)) {
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
    doBuild: {
        value: function () {
            try {
                var build = this.currentBuild,
                    status = 1,
                    output = new TextStream(new MemoryStream()),
                    errput = new TextStream(new MemoryStream());

                this.gitUpdate();
                build.sha = this.gitSha();
                this.writeBuild('current', build);

                build.process = createProcess({
                    command: this.runnerCommand(),
                    dir: this.projectPath
                });
                log.info('Building', build.shortSha());
                this.writeBuild('current', build);
                build.process.connect(null, output, errput);
                status = build.process.wait();
                log.info('Built {}: status={}', build.shortSha(), status);
                status === 0 ? buildWorked(output.content) :
                        buildFailed('', errput.content);
            } catch (error) {
                log.error('Exception building:', error);
                buildFailed('', error);
            }
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
    },
    gitUserAndProject: {
        value: function () {
            return new Config('remote.origin.url', this.projectPath)
                    .toString()
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
        value: function (hook) {
            var file = this.pathInProject(fs.join('.git', 'hooks', hook));
            if (fs.exists(file) && fs.permissions(file).other.execute) {
                var data = this.lastBuild && this.lastBuild.commit() ? {
                    MESSAGE: this.lastBuild.commit().message(),
                    AUTHOR: this.lastBuild.commit().author(),
                    SHA: this.lastBuild.commit().sha(),
                    OUTPUT: this.lastBuild.commit().envOutput()
                } : {};
            }
            for (let [name, value] in data) {
                system.env[name] = value;
            }
            var result = command('sh ' + file, {dir: this.projectPath});
            for (let [name, value] in data) {
                system.env[name] = null;
            }
            return result;
        }
    },
    restore: {
        value: function () {
            this.lastBuild = this.readBuild('last');
            this.currentBuild = this.readBuild('current');
            if (this.currentBuild && this.currentBuild.process) {
                try {
                    this.currentBuild.process.kill();
                } catch (error) {
                    this.currentBuild = null;
                }
            }
            
        }
    },
    pathInProject: {
        value: function (path) fs.join(this.projectPath, path)
    },
    writeBuild: {
        value: function (name, build) {
            var filename = this.pathInProject(
                    fs.join('.git', 'builds', name));
            if (!fs.isDirectory(this.pathInProject(
                    fs.join('.git', 'builds')))) {
                fs.makeDirectory(this.pathInProject(
                        fs.join('.git', 'builds')));
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
            return Build.load(this.pathInProject(
                    fs.join('.git', 'builds', name),
                    this.projectPath));
        }
    }
});
