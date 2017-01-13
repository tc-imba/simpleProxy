/**
 * Created by liu on 17-1-11.
 */
const config = require('./simpleproxy');

module.exports = {

  summary: function () {
    return "simpleProxy, based on AnyProxy";
  },

  //替换向服务器发出的请求参数（option)
  replaceRequestOption: function (req, option) {
    return redirectOption(option);
  },

  shouldUseLocalResponse: function (req, reqBody) {
    return req.method === "OPTIONS";
  },

  dealLocalResponse: function (req, reqBody, callback) {
    if (req.method === "OPTIONS") {
      callback(200, mergeCORSHeader(req.headers, {}, req.method), "");
    }
  },

  //替换服务器响应的http头
  replaceResponseHeader: function (req, res, header) {
    if (config.devEnv) console.log(req.method + ' ' + req.headers.host);
    return mergeCORSHeader(req.headers, header, req.method);
  }
};

function redirectOption(option) {

  // 处理URL
  let path = option.path;
  let paths = path.split('/');
  let pathStr = paths[0];
  let route = '/';
  let index = 0;
  for (let i = 1; i < paths.length; i++) {
    pathStr += '/' + paths[i];
    if (config.routes.hasOwnProperty(pathStr)) {
      route = pathStr;
      index = i;
    }
  }

  // 判断是否需要重定向
  if (route == '/' && !config.routes.hasOwnProperty('/')) {
    console.log('not matched, pass');
    return option;
  }

  // 计算后置路径（开头没有'/'）
  let additionPath = '';
  for (++index; index < paths.length; index++) {
    additionPath += paths[index];
    if (index < paths.length - 1) additionPath += '/';
  }

  route = config.routes[route];

  // 判断http请求方法
  if (route.method) {
    if (route.method.indexOf(option.method) < 0) {
      console.log(route.method + ' method denied for ' + route.redirect.host + '/' + route.redirect.path);
      return option;
    }
  }

  // 非http/https请求则调用其他函数（未开发）
  if (route.type && route.type != 'https' && route.type != 'http') {
    console.log('not http/https request, call other functions');
    return requestNotHttp(option, route);
  }

  // 授权（未开发）
  if (route.auth) {

  }

  // 替换http头
  option.hostname = route.redirect.host;
  option.headers.host = route.redirect.host;
  // route.redirect.path 开头结尾都没有'/'
  option.path = '';
  if (route.redirect.path) option.path += '/' + route.redirect.path;
  if (additionPath) option.path += '/' + additionPath;

  console.log('redirect to -> ' + option.hostname + option.path);
  return option;
}

function mergeCORSHeader(reqHeader, originHeader, method) {

  let targetObj = originHeader || {};

  if (reqHeader['origin']) {
    // 域名未添加到列表
    if (!config.cors.hasOwnProperty(reqHeader['origin'])) {
      if (config.devEnv) console.warn('cors access host denied: ' + reqHeader['origin']);
      return targetObj;
    }
    let cors_data = config.cors[reqHeader['origin']];
    // 不允许未指定method
    if (cors_data.hasOwnProperty('method') && cors_data.method.indexOf(method) < 0) {
      if (config.devEnv) console.warn('cors access method denied: ' + method + ' from ' + reqHeader['origin']);
      return targetObj;
    }

    if (config.devEnv) console.log('cors access verified: ' + reqHeader['origin']);

    // 修改cors头
    targetObj["access-control-allow-credentials"] = "true";
    targetObj["access-control-allow-origin"] = reqHeader['origin'];
    targetObj["access-control-allow-methods"] = "GET, POST, PUT";
    targetObj["access-control-allow-headers"] = reqHeader['access-control-request-headers'] || "";

    console.log('access-control-allow-origin <- ' + targetObj["access-control-allow-origin"]);
    if (reqHeader['access-control-request-headers']) {
      console.log('access-control-allow-headers <- ' + targetObj['access-control-allow-headers']);
    }
  }

  return targetObj;
}

function requestNotHttp(option, route) {
  if (config.devEnv) console.log(route);
  return option;
}

