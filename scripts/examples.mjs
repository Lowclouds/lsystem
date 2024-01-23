import * as fs from 'node:fs';

console.log('hi');
let dir = './assets/examples';
let dirent = fs.readdirSync(dir);
dirent.forEach((e) => console.log(e));

