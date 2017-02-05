const {app} = require('electron');

const path = require('path');
const fs = require('fs');
const AutoLaunch = require('auto-launch');

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
            pomodoro_duration: 50 * 60,   //Seconds
            short_break_duration: 5 * 60, //Seconds
            long_break_duration: 15 * 50, //Seconds
            num_pomodoros: 3,
            start_on_boot: true
        };
        //Initialize the AutoLaunch
        this.autolaunch = new AutoLaunch({
            name: 'Pomotron',
            isHidden: true
        });
        //Check that program is booting
        this.ensureCorrectAutolaunch()
    }

    //Loads the configuration from the filesystem
    load() {
        let parent = this;
        if (fs.existsSync(this.CONFIG_PATH)) {
            let data = fs.readFileSync(this.CONFIG_PATH);
            data = JSON.parse(data);
            for (let key in data) { //Replace only keys that are present
                parent.config[key] = data[key];
            }
        }
    }

    //Saves the configuration to the file system
    save() {
        fs.writeFile(this.CONFIG_PATH, JSON.stringify(this.config), function (err) {
            if (err) {
                return console.log(err);
            }
        });
        this.ensureCorrectAutolaunch();
    }

    //Returns the configuration value for the configuration key
    get(config_key) {
        return this.config[config_key];
    }

    //Sets the configuration value for the given values
    set(config_key, value) {
        this.config[config_key] = value;
    }

    //Returns a map with the configuration
    map() {
        return this.config;
    }

    //Ensures that the current autolaunch state matches with the of of the configuration
    ensureCorrectAutolaunch() {
        this.autolaunch.isEnabled().then(enabled => {
            if (enabled != this.config.start_on_boot) {
                if (this.config.start_on_boot) this.autolaunch.enable();
                else this.autolaunch.disable();
            }
        }).catch(err => console.log("Autolaunch Error: " + err))
    }

    //Returns the instances of the Configuration object. It creates it if it does not exist.
    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new Configuration(singletonEnforcer);
            this[singleton].load();
        }
        return this[singleton];
    }

}

module.exports = Configuration.instance;