/**
 * Created by liu on 17-1-11.
 */
function processRedirect(redirect, devEnv) {
  if (!redirect.hasOwnProperty('production'))return {};
  // 测试环境路径已设置，则使用测试环境路径，其他情况都使用生产环境路径
  let path = devEnv && redirect.hasOwnProperty('development') ? redirect.development : redirect.production;
  while (path[path.length - 1] == '/') {
    path = path.substr(0, path.length - 1);
  }
  // 拆分host和path
  let pos = path.indexOf('/');
  if (pos > 0) {
    return {host: path.substr(0, pos), path: path.substr(pos + 1)};
  }
  else {
    return {host: path, path: ''};
  }
}

function processPath(path) {
  if (path.length > 0 && path != '/') {
    if (path[0] != '/') {
      path = '/' + path;
    }
    while (path[path.length - 1] == '/') {
      path = path.substr(0, path.length - 1);
    }
    return path;
  }
  return '/';
}

function processCORS(path) {
  if (path.substr(0, 7) != 'http://' && path.substr(0, 8) != 'https://') {
    path = 'http://' + path;
  }
  while (path[path.length - 1] == '/') {
    path = path.substr(0, path.length - 1);
  }
  return path;
}


const proxy = require("anyproxy");

console.log('Initialize...\n');

const devEnv = process.env.NODE_ENV !== 'production';
if (devEnv) console.log('NODE_ENV ', process.env.NODE_ENV);
const config = require('../config/config.json');

let processedRoutes = {};
for (let i = 0; i < config.routes.length; i++) {
  let routes = require('../config/' + config.routes[i]);
  for (let key in routes) {
    if (!routes.hasOwnProperty(key)) continue;
    // 没有重定向地址，则不启用本条route
    if (!routes[key].hasOwnProperty('redirect')) {
      if (devEnv) console.error('[ERROR] redirect item not set in ' + key + ', ' + config.routes[i]);
      continue;
    }
    let redirect = processRedirect(routes[key].redirect, devEnv);
    // 生产环境路径未设置，则不启用本条route
    if (!redirect.hasOwnProperty('host') || !redirect.hasOwnProperty('path')) {
      if (devEnv) console.error('[ERROR] redirect production url not set in ' + routes[key].redirect + ', ' + config.routes[i]);
      continue;
    }
    // 设置运行后使用的配置
    let processed = {
      redirect: redirect,
      auth: routes[key].auth || false,
    };
    if (routes[key].hasOwnProperty('auth')) processed.auth = routes[key].auth;
    if (routes[key].hasOwnProperty('method')) processed.method = routes[key].method;
    if (routes[key].hasOwnProperty('type')) processed.type = routes[key].type;

    let path = processPath(key);
    // 重定向路径重复，则不启用本条route
    if (processedRoutes.hasOwnProperty(path)) {
      if (devEnv) console.error('[ERROR] path redefined ' + path + ', ' + config.routes[i]);
      continue;
    }
    processedRoutes[path] = processed;
    console.log('Loaded route: ' + path + ' -> ' + processed.redirect.host + '/' + processed.redirect.path);
  }
}

let processedCORS = {};
for (let key in config.cors) {
  if (!config.cors.hasOwnProperty(key)) continue;
  let processed = {};
  if (config.cors[key].hasOwnProperty('method')) processed.method = config.cors[key].method;
  let path = processCORS(key);
  processedCORS[path] = processed;
  console.log('Loaded cors: ' + path);
}

module.exports = {
  routes: processedRoutes,
  cors: processedCORS,
  devEnv: devEnv
};

// 配置server
const options = {
  hostname: config.server.hostname,
  port: config.server.port,
  type: config.server.type == 'https' ? 'https' : 'http', // 设置协议
  disableWebInterface: true, // 关闭web后台管理界面
  rule: require('./rule')
};
// 创建https证书
if (options.type == 'https') !proxy.isRootCAFileExists() && proxy.generateRootCA();

new proxy.proxyServer(options);

