import events = require('events');
import Autocompletion = require('./Autocompletion');
import Buffer = require('./Buffer');
import Aliases = require('./Aliases');
import History = require('./History');
import _ = require('lodash');
import i = require('./Interfaces');
import Language = require('./Language');

class Prompt extends events.EventEmitter {
    buffer: Buffer;
    // TODO: change the type.
    history: any;
    private autocompletion = new Autocompletion();

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer();
        this.buffer.on('data', () => {
            this.emit('data');
        });

        this.history = History;
    }

    send(value: string): void {
        this.buffer.setTo(value);
        this.history.append(value);
        this.emit('send');
    }

    getCommandName(): string {
        return this.expandCommand(this.buffer.toString())[0];

    }

    getArguments(): string[] {
        return this.getCommand().slice(1);
    }

    getCommand(): Array<string> {
        return this.expandCommand(this.buffer.toString())
    }

    getSuggestions(): Promise<i.Suggestion[]> {
        return this.autocompletion.getSuggestions(this.directory, this.buffer.toString())
    }

    replaceCurrentLexeme(suggestion: i.Suggestion): void {
        var lexemes = new Language().lex(this.buffer.toString());
        lexemes[lexemes.length - 1] = suggestion.value;

        this.buffer.setTo(lexemes.join(' '));
    }

    private expandCommand(command: string): Array<string> {
        // Split by comma, but not inside quotes.
        // http://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
        var parts = <string[]>command.match(/(?:[^\s']+|'[^']*')+/g);

        if (!parts) {
            return [];
        }
        var commandName = parts.shift();

        var alias: string = Aliases.find(commandName);

        if (alias) {
            parts = this.expandCommand(alias).concat(parts);
        } else {
            parts.unshift(commandName);
        }

        return parts;
    }
}

export = Prompt;
