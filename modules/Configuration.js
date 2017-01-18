const {app} = require('electron');

const path = require('path');
const fs = require('fs');

let singleton = Symbol();
let singletonEnforcer = Symbol();

class Configuration {
    constructor(enforcer) {
        if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
        this.CONFIG_PATH = path.format({
            dir: app.getPath("userData"),
            base: "preferences.json"
        });

        //Set defaults
        this.config = {
            pomodoro_duration: 50*60,   //Seconds
            short_break_duration: 5*60, //Seconds
            long_break_duration: 15*50, //Seconds
            num_pomodoros: 3
        };

    }

    load() {
        let parent = this;
        if (fs.existsSync(this.CONFIG_PATH)) {
            fs.readFile(this.CONFIG_PATH, function (error, data) {
                data = JSON.parse(data);
                for (let key in data) { //Replace only keys that are present
                    parent.config[key] = data[key];
                }
            });
        }
    }

    save() {
        fs.writeFile(this.CONFIG_PATH, JSON.stringify(this.config), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
    }

    map() {
        return this.config;
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new Configuration(singletonEnforcer);
            this[singleton].load();
        }
        return this[singleton];
    }

}

module.exports = Configuration.instance;