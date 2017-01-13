# simpleProxy

based on anyProxy

## Installation

由于anyproxy依赖大量库，建议使用淘宝npm进行安装，先运行`taobao-npm`即可

## Config
在 `config.json` 文件中配置代理功能，分为以下三块

### server
type: 设置代理类型（http/https）
port: 代理运行端口号
hostname: 代理运行主机
rule: 规则文件，不需要修改

### routes
进行代理时，会按照从深到浅的顺序进行匹配。如访问'/a/b/c/d'，匹配路径顺序依次为
'/a/b/c/d'，'/a/b/c'，'/a/b'，'/a'，直到找到可以匹配的为止。若匹配失败，则使用'/'

代理中可以限定method，缺省则接受所有method

重定向路径可以设置production和development，具体调用路径由NODE_ENV决定

auth授权暂无功能，以后完善

设置type后，可以拦截请求并使用type所对应的协议

### cors
进行跨域访问时，如果主机在cors列表中，则替换cors头使访问合法

使用options请求访问暂未完全实现

跨域访问也可以限定method，缺省则接受所有method

