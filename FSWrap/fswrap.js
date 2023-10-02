const fs = require('fs');
const path = require('node:path');

// On Windows filePath must be "configs\\configs.json"
// On Windows giving filePath like this "configs\configs.json" is evaluated as "configsconfigs.json"
// So double backslash is required.
// On Linux/MacOS filePath must be "configs/configs.json"

class FSWrap {
  constructor() {
    console.log("FSWrap called.");
  }

  verifyPath(filePath) {
    if (typeof filePath === 'string') {
      return filePath;
    } else if (Array.isArray(filePath)) {
      return path.join(...filePath);
    } else {
      throw new TypeError("The given file path must be string or array.");
    }
  }

  async exists(filePath) {
    return fs.promises.stat(this.verifyPath(filePath)).then(() => true, () => false);
  }


  async readFile(filePath) {
    return fs.promises.readFile(this.verifyPath(filePath), { encoding: 'utf8' });
  }


}

module.exports = FSWrap;
