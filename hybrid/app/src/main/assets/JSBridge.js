window.callbackId = 0;

var bridge = {
  call: function(method, arg, cb) {
    var args = {
      data: arg === undefined ? null : JSON.stringify(arg),
    };

    if (typeof cb === 'function') {
      var cbName = 'CALLBACK' + window.callbackId++;
      window[cbName] = cb; // JSBridge 执行时会往 window 上注册回调，eg：window.CALLBACK1
      // 那么之后执行回调时，原生会调用 myWebView.evaluateJavascript("javascript: CALLBACK1()", ...)
      console.log('windows', window[cbName]);
      args['cbName'] = cbName;
    }

    console.log('args', JSON.stringify(args));
    // "args {"data":"{\"msg\":\"The message is from JS!\"}","cbName":"CALLBACK0"}"
    // 参数是一个对象，两个属性：data 和 cbName

    if (window._jsbridge) {
      window._jsbridge.call(method, JSON.stringify(args));
    }
  }
};

module.exports = bridge;
