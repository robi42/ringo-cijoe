export('Config');
var fs = require('fs');
var {command} = require('ringo/subprocess');
var {format} = require('ringo/utils/strings');

var errorTemplate =
        'Error calling git config, is a recent version of git installed? '
        + 'Command: {}, Error: {}';

function Config(command, projectPath, parent) {
    this.command = command;
    this.parent = parent;
    this.projectPath = projectPath ||
            fs.join(module.directory, '..', '..', '..');
}

Object.defineProperties(Config.prototype, {
    toString: {
        value: function () {
            try {
                var gitCommand = 'git config ' + this.configString();
                return command(gitCommand, {dir: this.projectPath});
            } catch (error) {
                throw new Error(format(errorTemplate, gitCommand, error));
            }
        }
    },
    configString: {
        value: function () {
            return this.parent ? format('{}.{}',
                    this.parent.configString(), this.command) : this.command;
        }
    }
});
