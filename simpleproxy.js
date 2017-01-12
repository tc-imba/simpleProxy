/**
 * Created by liu on 17-1-11.
 */

const config = require('./config');

// 测试环境为false，生产环境为true
//const env = !(config.enviornment == 'test');
//console.log(env);

const proxy = require("anyproxy");

//create cert when you want to use https features
//please manually trust this rootCA when it is the first time you run it
!proxy.isRootCAFileExists() && proxy.generateRootCA();

const options = config.server;

options.rule = require(options.rule);

new proxy.proxyServer(options);
