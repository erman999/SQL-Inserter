const fs = require('fs');
const path = require('node:path');

// On Windows filePath must be "configs\\configs.json"
// On Windows giving filePath like this "configs\configs.json" is evaluated as "configsconfigs.json"
// So double backslash is required.
// On Linux/MacOS filePath must be "configs/configs.json"

class FSWrapper {
  constructor() { console.log("FSWrapper called."); }

  verifyPath(filePath) {
    if (typeof filePath === 'string') {
      return filePath;
    } else if (Array.isArray(filePath)) {
      return path.join(...filePath);
    } else {
      throw new Error("The given file path must be string or array.");
    }
  }

  exists(filePath) {
    return fs.promises.stat(this.verifyPath(filePath)).then(() => true, () => false);
  }

  readFile(filePath, encoding = 'utf8') {
    return fs.promises.readFile(this.verifyPath(filePath), { encoding: encoding });
  }

  async readFileJson(filePath, encoding = 'utf8') {
    const content = await fs.promises.readFile(this.verifyPath(filePath), { encoding: encoding });
    return JSON.parse(content.trim());
  }

  writeFile(filePath, data) {
    return fs.promises.writeFile(this.verifyPath(filePath), data);
  }

  writeFileJson(filePath, data) {
    return fs.promises.writeFile(this.verifyPath(filePath), JSON.stringify(data));
  }

  unlink(filePath) {
    return fs.promises.unlink(this.verifyPath(filePath));
  }

  removeFile(filePath) {
    return this.unlink(filePath);
  }

  rmdir(filePath) {
    return fs.promises.rmdir(this.verifyPath(filePath));
  }

  removeDir(filePath) {
    return this.rmdir(filePath);
  }

}

module.exports = FSWrapper;
