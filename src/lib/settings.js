
export class Settings {
  
  static #defaults = {
    loadDemoOnStartup: true,
    autoBuildOnLoad: true,
    useMultiTurtles: false,
    useInstances: true,
    genCode: false,
    interpSpeed: 250,
  };
  
  static #settings = undefined;

  static initialize() {
    Settings.#settings = Object.assign({}, Settings.#defaults);
    let keys = Object.keys(Settings.#settings);
    keys.forEach((k) => {
      let v = window.localStorage.getItem(k);
      if (! v) {
        window.localStorage.setItem(k, Settings.#defaults[k]);
      } else {
        Settings.#settings[k] = Settings.typeConvert(v);
      }
    });
    console.log(`initial Settings: ${JSON.stringify(Settings.#settings)}`);
    return Object.assign({}, Settings.#settings);
  }
  
  static typeConvert(s) {
    let v = Number(s);
    if (! isNaN(v)) {
      return v;
    } else if (s === 'true') {
      return true;
    } else if (s === 'false') { 
      return false;
    } else if (s[0] === '{' || s[0] == '[') {
      return JSON.parse(s);
    } else {
      return s;
    }
  }

  static getSettingsKeys() {
    return Object.keys(Settings.#settings);
  }

  static getSettings() {
    if ( Settings.#settings === undefined) {
      Settings.initialize();
    }
    return Object.assign({}, Settings.#settings);
  }

  static get(key) {
    if ( (! Settings.#settings === undefined) && (Object.hasOwn(Settings.#settings, key))) {
      return Settings.#settings[key];
    } else {
      return undefined;
    }
  }

  // this doesn't play well with the notion of a global save
  static set(key, value) {
    console.log(`Settings before set: ${JSON.stringify(Settings.#settings)}`);
    if (! (Settings.#settings === undefined) && (Object.hasOwn(Settings.#settings, key))) {
      Settings.#settings[key] = value;
      console.log(`Settings after set: ${JSON.stringify(Settings.#settings)}`);
    }
  }
  
  static save(userSettings) {
    Object.keys(userSettings).forEach((k) => {
      window.localStorage.setItem(k, userSettings[k]);
    });
  }

  static reset() {
    window.localStorage.clear();
    Settings.save(Settings.#defaults);
    Settings.#settings = Object.assign({}, Settings.#defaults);
    return Object.assign({}, Settings.#settings);
  }
}

