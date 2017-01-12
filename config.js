/**
 * Created by liu on 17-1-12.
 */

const fs = require('fs');
const yaml = require('js-yaml');

console.log('\nbegin to load configs...\n');

let config;
try {
  let doc = fs.readFileSync('./config.yaml', 'utf-8');
  config = yaml.safeLoad(doc);
} catch (e) {
  console.log(e);
  process.exit(-1);
}


if (!config.routes) {
  config.routes = {};
}

for (let key in config.routes) {
  if (!config.routes.hasOwnProperty(key) || config.routes[key]._processed)continue;
  // 处理路径
  let temp = config.routes[key];
  delete config.routes[key];
  if (key.length > 0 && key != '/') {
    if (key[0] != '/') {
      key = '/' + key;
    }
    while (key[key.length - 1] == '/') {
      key = key.substr(0, key.length - 1);
    }
  }
  config.routes[key] = temp;
  config.routes[key]._processed = true;
  // 判断是否有redirect地址
  if (config.routes[key].redirect) {
    // 判断当前配置使用的重定向地址
    let path;
    if (config.enviornment == 'test') {
      if (config.routes[key].redirect.test) {
        path = config.routes[key].redirect.test;
      } else if (config.routes[key].redirect.prod) {
        path = config.routes[key].redirect.prod;
      } else {
        console.log('ERROR: no redirect url for route: ' + key);
        delete config.routes[key];
        continue;
      }
    } else {
      if (config.routes[key].redirect.prod) {
        path = config.routes[key].redirect.prod;
      } else if (config.routes[key].redirect.test) {
        path = config.routes[key].redirect.test;
      } else {
        console.log('ERROR: no redirect url for route: ' + key);
        delete config.routes[key];
        continue;
      }
    }
    while (path[path.length - 1] == '/') {
      path = path.substr(0, path.length - 1);
    }
    let pos = path.indexOf('/');
    if (pos > 0) {
      config.routes[key].redirect = {host: path.substr(0, pos), path: path.substr(pos + 1)};
    }
    else {
      config.routes[key].redirect = {host: path, path: ''};
    }
    console.log('Loaded route: ' + key + ' -> ' + config.routes[key].redirect.host + '/' + config.routes[key].redirect.path);
  } else {
    console.error('[ERROR] no redirect url for route: ' + key);
    delete config.routes[key];
  }
}

console.log();

module.exports = config;
