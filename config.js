/**
 * Created by liu on 17-1-12.
 */

const fs = require('fs');
const yaml = require('js-yaml');

console.log('\nbegin to load configs...\n');

let config;
try {
  let doc = fs.readFileSync('./config.json', 'utf-8');
  //config = yaml.safeLoad(doc);
  config = JSON.parse(doc);
} catch (e) {
  console.log(e);
  process.exit(-1);
}

//config.server.disableWebInterface = true;

if (!config.routes) {
  config.routes = {};
  console.warn('No routes found!');
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
    if (process.env.NODE_ENV === 'production') {
      if (config.routes[key].redirect.development) {
        path = config.routes[key].redirect.development;
      } else if (config.routes[key].redirect.production) {
        path = config.routes[key].redirect.production;
      } else {
        console.error('[ERROR] no redirect url for route: ' + key);
        delete config.routes[key];
        continue;
      }
    } else {
      if (config.routes[key].redirect.production) {
        path = config.routes[key].redirect.production;
      } else if (config.routes[key].redirect.development) {
        path = config.routes[key].redirect.development;
      } else {
        console.error('[ERROR] no redirect url for route: ' + key);
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

for (let key in config.cors) {
  if (!config.cors.hasOwnProperty(key) || config.cors[key]._processed)continue;
  let temp = config.cors[key];
  delete config.cors[key];
  if (key.substr(0, 7) != 'http://' && key.substr(0, 8) != 'https://') {
    key = 'http://' + key;
  }
  while (key[key.length - 1] == '/') {
    key = key.substr(0, key.length - 1);
  }
  config.cors[key] = temp;
  config.cors[key]._processed = true;
  console.log('Loaded cors: ' + key);
}



module.exports = config;
