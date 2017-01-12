/**
 * Created by liu on 17-1-11.
 */
const config = require('./config');

module.exports = {
  /*
   These functions will overwrite the default ones, write your own when necessary.
   Comments in Chinese are nothing but a translation of key points. Be relax if you dont understand.
   致中文用户：中文注释都是只摘要，必要时请参阅英文文档。欢迎提出修改建议。
   */
  summary: function () {
    return "simpleProxy, based on AnyProxy";
  },

  //=======================
  //when getting a request from user
  //收到用户请求之后
  //=======================

  //是否截获https请求
  //should intercept https request, or it will be forwarded to real server
  shouldInterceptHttpsReq: function (req) {
    return false;
  },

  //是否在本地直接发送响应（不再向服务器发出请求）
  //whether to intercept this request by local logic
  //if the return value is true, anyproxy will call dealLocalResponse to get response data and will not send request to remote server anymore
  //req is the user's request sent to the proxy server
  shouldUseLocalResponse: function (req, reqBody) {
    return false;
  },

  //如果shouldUseLocalResponse返回true，会调用这个函数来获取本地响应内容
  //you may deal the response locally instead of sending it to server
  //this function be called when shouldUseLocalResponse returns true
  //callback(statusCode,resHeader,responseData)
  //e.g. callback(200,{"content-type":"text/html"},"hello world")
  dealLocalResponse: function (req, reqBody, callback) {
    callback(statusCode, resHeader, responseData)
  },


  //=======================
  //when ready to send a request to server
  //向服务端发出请求之前
  //=======================

  //替换向服务器发出的请求协议（http和https的替换）
  //replace the request protocol when sending to the real server
  //protocol : "http" or "https"
  replaceRequestProtocol: function (req, protocol) {
    var newProtocol = protocol;
    return newProtocol;
  },

  //替换向服务器发出的请求参数（option)
  //option is the configuration of the http request sent to remote server. You may refers to http://nodejs.org/api/http.html#http_http_request_options_callback
  //you may return a customized option to replace the original one
  //you should not overwrite content-length header in options, since anyproxy will handle it for you
  replaceRequestOption: function (req, option) {
    return redirectOption(option);
  },

  //替换请求的body
  //replace the request body
  replaceRequestData: function (req, data) {
    return data;
  },


  //=======================
  //when ready to send the response to user after receiving response from server
  //向用户返回服务端的响应之前
  //=======================

  //替换服务器响应的http状态码
  //replace the statusCode before it's sent to the user
  replaceResponseStatusCode: function (req, res, statusCode) {
    var newStatusCode = statusCode;
    return newStatusCode;
  },

  //替换服务器响应的http头
  //replace the httpHeader before it's sent to the user
  //Here header == res.headers
  replaceResponseHeader: function (req, res, header) {
    return mergeCORSHeader(req.headers, header);
  },

  //替换服务器响应的数据
  //replace the response from the server before it's sent to the user
  //you may return either a Buffer or a string
  //serverResData is a Buffer. for those non-unicode reponse , serverResData.toString() should not be your first choice.
  replaceServerResDataAsync: function (req, res, serverResData, callback) {
    callback(serverResData);
  },

  //Deprecated
  // replaceServerResData: function(req,res,serverResData){
  //     return serverResData;
  // },

  //在请求返回给用户前的延迟时间
  //add a pause before sending response to user
  pauseBeforeSendingResponse: function (req, res) {
    var timeInMS = 1; //delay all requests for 1ms
    return timeInMS;
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
      console.log(route.method.indexOf(option.method));
      return option;
    }
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

// Copied from github
function mergeCORSHeader(reqHeader, originHeader) {
  let targetObj = originHeader || {};

  delete targetObj["Access-Control-Allow-Credentials"];
  delete targetObj["Access-Control-Allow-Origin"];
  delete targetObj["Access-Control-Allow-Methods"];
  delete targetObj["Access-Control-Allow-Headers"];

  targetObj["access-control-allow-credentials"] = "true";
  targetObj["access-control-allow-origin"] = reqHeader['origin'] || "-___-||";
  targetObj["access-control-allow-methods"] = "GET, POST, PUT";
  targetObj["access-control-allow-headers"] = reqHeader['access-control-request-headers'] || "-___-||";

  return targetObj;
}
