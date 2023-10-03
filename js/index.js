const path = require('node:path');

const FSWrapper = require('./fswrap.js');
const fsw = new FSWrapper();


async function test() {

  let filePath = ['configs', 'erman.txt'];

  let isExists = await fsw.exists(filePath);
  console.log("isExists:", isExists);

  console.log("*********** BEFORE **************");
  let content = await fsw.readFile(filePath);
  console.log(content);
  console.log("*********** AFTER **************");



  let filePath2 = ['configs', 'configs2.json'];

}

test();
