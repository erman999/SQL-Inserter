const path = require('node:path');

const FSWrap = require('./fswrap.js');
const fsw = new FSWrap();


async function test() {

  let filePath = ['configs', 'erman.txt'];

  let isExists = await fsw.exists(filePath);
  console.log("isExists:", isExists);

  let content = await fsw.readFile(filePath);
  console.log(content);
}

test();
