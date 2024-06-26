# Hybrid 混合开发简单探索

[TOC]





之前花了很多时间看相关博客，但是总感觉结果不尽如人意，对这种实现方案是接受但不理解，所以又一切重置，从零开始花了很多时间搭了一个 demo，虽然现在仍有一些瑕疵，但有一种豁然开朗的感觉。

可能这就是”talk is cheap, show me your code.“



ps: 下面的笔记都是抄的，本人技术有限，写不出来。



# 最基本的理解要知道

这里只介绍基于 WebView UI 的方案。

Hybrid APP的本质，可以理解成 原生安卓/IOS 做壳子，里面嵌入 H5。在安卓中，有个 WebView 的 API 支持嵌入页面，代码类似于：

```js
//方式1. 加载一个网页：
webView.loadUrl("http://www.google.com/");
// 当然，也可以加载 安卓 assets 中的资源（之后有详细笔记）
```

![JSBridge](/assets/WebView.jpg)



接着思考，嵌入 H5 还没结束，遇到一些特殊场景：用户调用摄像头，日历；分享到第三方APP 等操作，仅靠 H5 是无法实现的，原生(Native)可以实现，那么就涉及到了Native 端 和 H5 端之间的**双向通讯层**，这就是**JSBridge** 

<img src="/assets/JSBridge.jpg"  width="400" />



接着，遇到的问题可能是原生加载 H5 页面过程中的白屏问题(水平有限，之前没接触过混合开发，我不知道真假，应该是真的，因为我自己本地跑的时候就能明显的看到白屏)

直接说优化方案：使用离线包，就是先将页面需要的静态资源打包并预先加载到客户端的安装包中，当用户安装时，再将资源解压到本地存储中，当 WebView 加载某个 H5 页面时，拦截发出的所有 http 请求，查看请求的资源是否在本地存在，如果存在则直接返回资源。

![离线包](/assets/离线包.png)



**核心流程**

![离线包核心流程](/assets/离线包核心流程.png)





## 简单实践分三步走

- [ ] 了解 android 中如何嵌入 H5（使用 webView）
- [ ] 原生 和 H5 的 通信原理（JSBridge）
- [ ] webView 的 离线资源包更新



## 仓库代码文件夹说明

- admin: 后端（NestJS）
- admin-client: 离线包可视化平台（React）
- bundle-plugin: 测试H5项目 + 上传离线包的 vite plugin
- hybrid: 安卓端壳子



注：为了方便本地开发时，安卓原生的 WebView 嵌入 H5，全部使用电脑本机IP地址

端口号说明：

- client: 5173（即：192.168.1.7:5173）

- admin: 3000

- bundle-plugin: 8991



因为对安卓端不熟悉，而且混合开发可以找到的代码都已经很久远了，基本上每个仓库的代码拉到本地都会报错，所以安卓端代码并没有完全跑通(差分包部分报错)，但 Log 日志写的很清楚，参考 Log 日志即可。






## 一些参考文章/代码/视频
### JSBridge

1. [https://github.com/mcuking/JSBridge](https://github.com/mcuking/JSBridge)
2. [https://github.com/mcuking/blog/issues/39](https://github.com/mcuking/blog/issues/39)



### webview

1. [https://www.jianshu.com/p/345f4d8a5cfa](https://www.jianshu.com/p/345f4d8a5cfa)
2. [2-12 WebView_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Rt411e76H?p=18&vd_source=cb0f2ca83acbbbf237e17c761cf7bc37)
3. [千锋教育_安卓混合开发（hybridapp）视频精讲_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV12t411L7Pn/?spm_id_from=333.999.0.0&vd_source=cb0f2ca83acbbbf237e17c761cf7bc37)
4. [WebView组件封装(五)——实现H5页面秒开方案总结](https://juejin.cn/post/7348824894157160474#heading-0)



### 离线资源包

1. [https://www.cnblogs.com/yexiaochai/p/4921635.html](https://www.cnblogs.com/yexiaochai/p/4921635.html)
2. [https://www.cnblogs.com/yexiaochai/p/5524783.html](https://www.cnblogs.com/yexiaochai/p/5524783.html)
3. [转转hybrid app web静态资源离线系统实践](https://juejin.cn/post/6844903546073120775?searchId=20240331093211C01BF4CE81E56FBB326E#heading-5)
4. [离线Hybrid容器如何做到接近100%秒开？](https://juejin.cn/post/6949103404266291231#heading-8)
5. [Hybrid APP 架构设计思路-H5离线动态更新机制](https://juejin.cn/post/6844903425721761799#heading-10)
6. [得到 Hybrid 架构的演进之路 - 掘金](https://juejin.cn/post/6844904049448321032#heading-15)
7. [https://github.com/mcuking/blog/issues/63](https://github.com/mcuking/blog/issues/63)
8. [https://github.com/free46000/HybridFoundation](https://github.com/free46000/HybridFoundation)
9. [货拉拉 Android H5离线包原理与实践](https://juejin.cn/post/7119662876578545678?searchId=20240531163728F7C354948163FD0DC56D#heading-3)
10. [https://github.com/mcuking/mobile-web-best-practice-container](https://github.com/mcuking/mobile-web-best-practice-container)
11. https://github.com/bigo-frontend/blog/issues/74







# JSBridge 通信

在Hybrid模式下，H5会需要使用Native的功能，比如打开二维码扫描、调用原生页面、获取用户信息等，同时Native也需要向Web端发送推送、更新状态等。
## Native调用H5的功能(发送回调，更新提醒)

- loadUrl
- evaluateJavascript
```typescript
mWebview.loadUrl("javascript: func()");

// 2. 
mWebview.evaluateJavascript("javascript: func()", new ValueCallback<String>() {
    @Override
    public void onReceiveValue(String value) {
        return;
    }
});
```


## H5调用Native的功能(扫描二维码)
### 描述
H5 调用 Native 在实现上有 2 种方式：

1. 理论上，无论是 iOS 还是 Android，提供的 WebView 容器是可以拦截一切 H5 发起的请求的，无论是标准协议（如 http://、https:// 等）还是私有协议（如 weixin:// ）。基于这个原理，H5 采用私有协议模拟发起 URL 请求，Native 解析这类 URL 并定制相应的处理函数，这就实现了 H5 调用 Native。
2. 在 Native 的开发中，开发者可以给 WebView 容器注入全局变量并挂载在 window 对象上，这样前端 js 就可以通过 window 上全局对象方法 来调用一些 Native 的方法。这里需要注意的是方法注入的时机，一般是 WebView 一旦加载页面就需要注入变量。

![Snipaste_2019-11-09_05-25-59.png](/assets/H5ToNative.png)

### 实现一：拦截 Url Schema
即由 h5 发出一条新的跳转请求，native 通过拦截 URL 获取 h5 传过来的数据。
跳转的目的地是一个非法不存在的 URL 地址，例如：
```typescript
"jsbridge://methodName?{"data": arg, "cbName": cbName}"
```
具体示例如下：
```typescript
"jsbridge://openScan?{"data": {"scanType": "qrCode"}, "cbName": "handleScanResult"}"
```
h5 和 native 约定一个通信协议，例如 jsbridge, 同时约定调用 native 的方法名 methodName 作为域名，以及后面带上调用该方法的参数 arg，和接收该方法执行结果的 js 方法名 cbName。
具体可以在 js 端封装相关方法，供业务端统一调用，代码如下：
```typescript
window.callbackId = 0;

function callNative(methodName, arg, cb) {
    const args = {
      data: arg === undefined ? null : JSON.stringify(arg),
    };

    if (typeof cb === 'function') {
      const cbName = 'CALLBACK' + window.callbackId++;
      window[cbName] = cb;
      args['cbName'] = cbName;
    }

    const url = 'jsbridge://' + methodName + '?' + JSON.stringify(args);

    ...
}
```
以上封装中较为巧妙的是将用于接收 native 执行结果的 js 回调方法 cb 挂载到 window 上，并为防止命名冲突，通过全局的 callbackId 来区分，然后将该回调函数在 window 上的名字放在参数中传给 native 端。native 拿到 cbName 后，执行完方法后，将执行结果通过 native 调用 js 的方式（上面提到的两种方法），调用 cb 传给 h5 端（例如将扫描结果传给 h5）。
至于如何在 h5 中发起请求，可以设置 window.location.href 或者创建一个新的 iframe 进行跳转。
```typescript
function callNative(methodName, arg, cb) {
    ...

    const url = 'jsbridge://' + method + '?' + JSON.stringify(args);

    // 通过 location.href 跳转
    window.location.href = url;

    // 通过创建新的 iframe 跳转
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = 0;
    iframe.style.height = 0;
    document.body.appendChild(iframe);

    window.setTimeout(function() {
        document.body.removeChild(iframe);
    }, 800);
}
```
native 会拦截 h5 发出的请求，当检测到协议为 jsbridge 而非普通的 http/https/file 等协议时，会拦截该请求，解析出 URL 中的 methodName、arg、 cbName，执行该方法并调用 js 回调函数。
下面以安卓为例，通过覆盖 WebViewClient 类的 shouldOverrideUrlLoading 方法进行拦截，android 端具体封装会在下面单独的板块进行说明。

```typescript
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class JSBridgeViewClient extends WebViewClient {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        JSBridge.call(view, url);
        return true;
    }
}
```

#### 拦截 URL Schema 的问题

- 连续发送时消息丢失

如下代码：
```typescript
window.location.href = "jsbridge://callNativeNslog?{"data": "111", "cbName": ""}";
window.location.href = "jsbridge://callNativeNslog?{"data": "222", "cbName": ""}";
```
js 此时的诉求是在同一个运行逻辑内，快速的连续发送出 2 个通信请求，用客户端本身 IDE 的 log，按顺序打印 111，222，那么实际结果是 222 的通信消息根本收不到，直接会被系统抛弃丢掉。
原因：因为 h5 的请求归根结底是一种模拟跳转，跳转这件事情上 webview 会有限制，当 h5 连续发送多条跳转的时候，webview 会直接过滤掉后发的跳转请求，因此第二个消息根本收不到，想要收到怎么办？js 里将第二条消息延时一下。

```typescript
//发第一条消息
location.href = "jsbridge://callNativeNslog?{"data": "111", "cbName": ""}";

//延时发送第二条消息
setTimeout(500,function(){
    location.href = "jsbridge://callNativeNslog?{"data": "222", "cbName": ""}";
});
```
但这并不能保证此时是否有其他地方通过这种方式进行请求，为系统解决此问题，js 端可以封装一层队列，所有 js 代码调用消息都先进入队列并不立刻发送，然后 h5 会周期性比如 500 毫秒，清空一次队列，保证在很快的时间内绝对不会连续发 2 次请求通信。

- URL 长度限制

如果需要传输的数据较长，例如方法参数很多时，由于 URL 长度限制，仍以丢失部分数据。


### 实现二：给 WebView 容器注入全局变量并挂载在 window 对象上
native 将实例对象通过 webview 提供的方法注入到 js 全局上下文，js 可以通过调用 native 的实例方法来进行通信。
下面以安卓 webview 的 addJavascriptInterface 为例进行讲解。
首先 native 端注入实例对象到 js 全局上下文，代码大致如下，具体封装会在下面的单独板块进行讲解：
```typescript
public class MainActivity extends AppCompatActivity {

    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = (WebView) findViewById(R.id.mWebView);

        ...

        // 将 NativeMethods 类下面的提供给 js 的方法转换成 hashMap
        JSBridge.register("JSBridge", NativeMethods.class);

        // 将 JSBridge 的实例对象注入到 js 全局上下文中，名字为 _jsbridge，该实例对象下有 call 方法
        mWebView.addJavascriptInterface(new JSBridge(mWebView), "_jsbridge");
    }
}

// 这个类把 原生 暴露给 H5 的方法进行整合，便于维护
public class NativeMethods {
    // 用来供 js 调用的方法
    public static void methodName(WebView view, JSONObject arg, CallBack callBack) {
    }
}

public class JSBridge {
    private WebView mWebView;

    public JSBridge(WebView webView) {
        this.mWebView = webView;
    }


    private  static Map<String, HashMap<String, Method>> exposeMethods = new HashMap<>();

    // 静态方法，用于将传入的第二个参数的类下面用于提供给 javacript 的接口转成 Map，名字为第一个参数
    public static void register(String exposeName, Class<?> classz) {
        ...
    }

    // 实例方法，用于提供给 js 统一调用的方法
// 在安卓 4.2 版本后，可以通过在提供给 js 调用的 java 方法前加装饰器 @JavascriptInterface，来表明仅该方法可以被 js 调用
    @JavascriptInterface
    public String call(String methodName, String args) {
        ...
    }
}
```
然后 h5 端可以在 js 调用 window._jsbridge 实例下面的 call 方法，传入的数据组合方式可以类似上面两种方式。具体代码如下：
```typescript
window.callbackId = 0;

function callNative(method, arg, cb) {
  let args = {
    data: arg === undefined ? null : JSON.stringify(arg)
  };

  if (typeof cb === 'function') {
    const cbName = 'CALLBACK' + window.callbackId++;
    window[cbName] = cb;
    args['cbName'] = cbName;
  }

  if (window._jsbridge) {
    window._jsbridge.call(method, JSON.stringify(args));
  }
}
```



### 实现二（简洁版）
**先看这一版的代码，再掂回去看上面的**
```typescript
// 加载本地页面
wv.loadUrl("file:///android_asset/index_old.html");

// 加载本地页面: 通信 （给 WebView 容器注入全局变量并挂载在 window 对象上）: 旧的 JSBridge
wv.addJavascriptInterface(new OldJSBridge(getApplicationContext()), "MyJSBridge");
```

```typescript
class OldJSBridge {
    private Context context;
    public OldJSBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void showToast() { // 可以由前端调用 window.MyJSBridge.showToast() 方法
        Toast.makeText(MainActivity.this, "H5调用 原生 Toast", Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void showToastParams(String str) { // 可以由前端调用 window.MyJSBridge.showToast() 方法
        Toast.makeText(MainActivity.this, "H5调用 原生 Toast, 传参" + str, Toast.LENGTH_SHORT).show();
    }

}
```

`@JavascriptInterface`重写的方法就是 H5 可以直接使用的方法。
```typescript
<script>
    $('#btn').on('click', function() {
      console.log('js按钮, 调用android的Toast功能')

      window.MyJSBridge.showToast()

      window.MyJSBridge.showToastParams("传参")
    })

// 这个方法是 原生 可以使用的
    function getData(str) {
        $('#msg').html(str);
    }
</script>
```

```typescript
// 原生调用 H5 的方法
wv.loadUrl("javascript:getData('原生 传给 H5')");
```



## JSBridge 实现🎯

这个是上面的实现二的完整说明。

### step1：native上挂载实例到 H5
```typescript
wv.loadUrl("file:///android_asset/index.html");

// 将 NativeMethods 类下面的提供给 js （相当于把 H5 的方法单独抽离到class类，方便维护）
JSBridge.register("JSBridge", NativeMethods.class);

// wv 就是创建的 webview实例，这里我们挂载了 JSBridge 实例到 Windows上，访问时可通过 window._JSBridge
wv.addJavascriptInterface(new JSBridge(wv), "_JSBridge");
```

### step2: 整体流程说明


### step3: JSBridge
整体的架子如下：
```typescript
public class JSBridge {
    private WebView mWebView;

    public JSBridge(WebView webView) {
        this.mWebView = webView;
    }

    private  static Map<String, HashMap<String, Method>> exposeMethods = new HashMap<>();

    public static void register(String exposeName, Class<?> classz) { }

    private static HashMap<String, Method> getAllMethod(Class injectedCls) { }

    @JavascriptInterface
    public String call(String methodName, String args) { }
}
```

**算了，直接看仓库源码吧，写的很清楚：**[**https://github.com/mengqiuleo/hybrid-demo**](https://github.com/mengqiuleo/hybrid-demo)



# webView 嵌入 H5

[Carson带你学Android：全面总结WebView与 JS 的交互方式](https://www.jianshu.com/p/345f4d8a5cfa)


分成三部分讲解：

- Webview类自身的常见方法（加载资源）
- Webview的最常用的工具类：WebSettings类、WebViewClient类、WebChromeClient类
- Android 和 Js的交互

![5315ab3e9e114ffaae7d98c7f19931f2~tplv-k3u1fbpfcp-jj-mark_3024_0_0_0_q75.webp](/assets/常用类.webp)


## Webview类常用方法
### 加载资源
加载方式根据资源分为三种
```typescript
//方式1. 加载一个网页：
webView.loadUrl("http://www.google.com/");

//方式2：加载apk包中的html页面
webView.loadUrl("file:///android_asset/test.html");

//方式3：加载手机本地的html页面（SDK卡页面）
webView.loadUrl("content://com.android.htmlfileprovider/sdcard/test.html");

// 方式4： 加载 HTML 页面的一小段内容（没用过）
WebView.loadData(String data, String mimeType, String encoding)
// 参数说明：
// 参数1：需要截取展示的内容
// 内容里不能出现 ’#’, ‘%’, ‘\’ , ‘?’ 这四个字符，若出现了需用 %23, %25, %27, %3f 对应来替代，否则会出现异常
// 参数2：展示内容的类型
// 参数3：字节码
```

### WebView的状态
```typescript
//激活WebView为活跃状态，能正常执行网页的响应
webView.onResume()

//当页面被失去焦点被切换到后台不可见状态，需要执行onPause
//通过onPause动作通知内核暂停所有的动作，比如DOM的解析、plugin的执行、JavaScript执行。
webView.onPause()

//当应用程序(存在webview)被切换到后台时，这个方法不仅仅针对当前的webview而是全局的全应用程序的webview
//它会暂停所有webview的layout，parsing，javascripttimer。降低CPU功耗。
webView.pauseTimers()
//恢复pauseTimers状态
webView.resumeTimers()

//销毁Webview
//在关闭了Activity时，如果Webview的音乐或视频，还在播放。就必须销毁Webview
//但是注意：webview调用destory时,webview仍绑定在Activity上
//这是由于自定义webview构建时传入了该Activity的context对象
//因此需要先从父容器中移除webview,然后再销毁webview:
rootLayout.removeView(webView); 
webView.destroy();
```


### 关于前进 / 后退网页
```typescript
//是否可以后退
Webview.canGoBack() 
//后退网页
Webview.goBack()

//是否可以前进                     
Webview.canGoForward()
//前进网页
Webview.goForward()

//以当前的index为起始点前进或者后退到历史记录中指定的steps
//如果steps为负数则为后退，正数则为前进
Webview.goBackOrForward(intsteps)
```

**常见用法：Back键控制网页后退**

- 问题：在不做任何处理前提下 ，浏览网页时点击系统的“Back”键,整个 Browser 会调用 finish()而结束自身
- 目标：点击返回后，是网页回退而不是推出浏览器
- 解决方案：在当前Activity中处理并消费掉该 Back 事件
```typescript
public boolean onKeyDown(int keyCode, KeyEvent event) {
    if ((keyCode == KEYCODE_BACK) && mWebView.canGoBack()) { 
        mWebView.goBack();
        return true;
    }
    return super.onKeyDown(keyCode, event);
}
```


### 清除缓存数据
```typescript
//清除网页访问留下的缓存
//由于内核缓存是全局的因此这个方法不仅仅针对webview而是针对整个应用程序.
Webview.clearCache(true);

//清除当前webview访问的历史记录
//只会webview访问历史记录里的所有记录除了当前访问记录
Webview.clearHistory()

//这个api仅仅清除自动完成填充的表单数据，并不会清除WebView存储到本地的数据
Webview.clearFormData()
```


## 常用的工具类
### WebSettings类

- 作用：对WebView进行配置和管理

#### 配置步骤
**step1: 添加访问网络权限**（AndroidManifest.xml）
```typescript
<uses-permission android:name="android.permission.INTERNET"/>
```

**step2: 生成一个WebView组件（有两种方式）**
```typescript
//方式1：直接在在Activity中生成
WebView webView = new WebView(this)

//方法2：在Activity的layout文件里添加webview控件：
WebView webview = (WebView) findViewById(R.id.webView1);
```

**step3: 进行配置-利用WebSettings子类**（常见方法）
```typescript
//声明WebSettings子类
WebSettings webSettings = webView.getSettings();

//如果访问的页面中要与Javascript交互，则webview必须设置支持Javascript
webSettings.setJavaScriptEnabled(true);  
// 若加载的 html 里有JS 在执行动画等操作，会造成资源浪费（CPU、电量）
// 在 onStop 和 onResume 里分别把 setJavaScriptEnabled() 给设置成 false 和 true 即可

//支持插件
webSettings.setPluginsEnabled(true); 

//设置自适应屏幕，两者合用
webSettings.setUseWideViewPort(true); //将图片调整到适合webview的大小 
webSettings.setLoadWithOverviewMode(true); // 缩放至屏幕的大小

//缩放操作
webSettings.setSupportZoom(true); //支持缩放，默认为true。是下面那个的前提。
webSettings.setBuiltInZoomControls(true); //设置内置的缩放控件。若为false，则该WebView不可缩放
webSettings.setDisplayZoomControls(false); //隐藏原生的缩放控件

//其他细节操作
webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); //关闭webview中缓存 
webSettings.setAllowFileAccess(true); //设置可以访问文件 
webSettings.setJavaScriptCanOpenWindowsAutomatically(true); //支持通过JS打开新窗口 
webSettings.setLoadsImagesAutomatically(true); //支持自动加载图片
webSettings.setDefaultTextEncodingName("utf-8");//设置编码格式
```


#### 常见方法
**设置WebView缓存**

- 当加载 html 页面时，WebView会在/data/data/包名目录下生成 database 与 cache 两个文件夹
- 请求的 URL记录保存在 WebViewCache.db，而 URL的内容是保存在 WebViewCache 文件夹下
- 是否启用缓存：
```typescript
//优先使用缓存: 
WebView.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); 
    //缓存模式如下：
    //LOAD_CACHE_ONLY: 不使用网络，只读取本地缓存数据
    //LOAD_DEFAULT: （默认）根据cache-control决定是否从网络上取数据。
    //LOAD_NO_CACHE: 不使用缓存，只从网络获取数据.
    //LOAD_CACHE_ELSE_NETWORK，只要本地有，无论是否过期，或者no-cache，都使用缓存中的数据。

//不使用缓存: 
WebView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
```

- 结合使用（离线加载）
```typescript
if (NetStatusUtil.isConnected(getApplicationContext())) {
    webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);//根据cache-control决定是否从网络上取数据
} else {
    webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);//没网，则从本地获取，即离线加载
}

webSettings.setDomStorageEnabled(true); // 开启 DOM storage API 功能
webSettings.setDatabaseEnabled(true);   //开启 database storage API 功能
webSettings.setAppCacheEnabled(true); //开启 Application Caches 功能

String cacheDirPath = getFilesDir().getAbsolutePath() + APP_CACAHE_DIRNAME;
webSettings.setAppCachePath(cacheDirPath); //设置  Application Caches 缓存目录
```
**注意：** 每个 Application 只调用一次 WebSettings.setAppCachePath()，WebSettings.setAppCacheMaxSize()

### WebViewClient类

- 作用：处理各种通知 & 请求事件

#### 常用方法
**shouldOverrideUrlLoading()**

- 作用：**打开网页时不调用系统浏览器， 而是在本WebView中显示**；在网页上的所有加载都经过这个方法,这个函数我们可以做很多操作。
```typescript
//步骤1. 定义Webview组件
Webview webview = (WebView) findViewById(R.id.webView1);

//步骤2. 选择加载方式
  //方式1. 加载一个网页：
  webView.loadUrl("http://www.google.com/");

  //方式2：加载apk包中的html页面
  webView.loadUrl("file:///android_asset/test.html");

  //方式3：加载手机本地的html页面
   webView.loadUrl("content://com.android.htmlfileprovider/sdcard/test.html");

//步骤3. 复写shouldOverrideUrlLoading()方法，使得打开网页时不调用系统浏览器， 而是在本WebView中显示
    webView.setWebViewClient(new WebViewClient(){
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, String url) {
          view.loadUrl(url);
      return true;
      }
  });
```

**onPageStarted()**

- 作用：开始载入页面调用的，我们可以设定一个loading的页面，告诉用户程序在等待网络响应。
```typescript
webView.setWebViewClient(new WebViewClient(){
     @Override
     public void  onPageStarted(WebView view, String url, Bitmap favicon) {
        //设定加载开始的操作
     }
});
```

**onPageFinished()**

- 作用：在页面加载结束时调用。我们可以关闭loading 条，切换程序动作。
```typescript
webView.setWebViewClient(new WebViewClient(){
      @Override
      public void onPageFinished(WebView view, String url) {
         //设定加载结束的操作
      }
});
```

**onLoadResource()**

- 作用：在加载页面资源时会调用，每一个资源（比如图片）的加载都会调用一次。
```typescript
webView.setWebViewClient(new WebViewClient(){
    @Override
    public boolean onLoadResource(WebView view, String url) {
       //设定加载资源的操作
    }
});
```

**onReceivedError（）**

- 作用：加载页面的服务器出现错误时（如404）调用。
> App里面使用webview控件的时候遇到了诸如404这类的错误的时候，若也显示浏览器里面的那种错误提示页面就显得很丑陋了，那么这个时候我们的app就需要加载一个本地的错误提示页面，即webview如何加载一个本地的页面

```typescript
//步骤1：写一个html文件（error_handle.html），用于出错时展示给用户看的提示页面
//步骤2：将该html文件放置到代码根目录的assets文件夹下

//步骤3：复写WebViewClient的onRecievedError方法
//该方法传回了错误码，根据错误类型可以进行不同的错误分类处理
webView.setWebViewClient(new WebViewClient(){
      @Override
      public void onReceivedError(WebView view, int errorCode, String description, String failingUrl){
            switch(errorCode)
                {
                case HttpStatus.SC_NOT_FOUND:
                    view.loadUrl("file:///android_assets/error_handle.html");
                    break;
                }
            }
});
```


**onReceivedSslError()**

- 作用：处理https请求
- webView默认是不处理https请求的，页面显示空白，需要进行如下设置：
```typescript
webView.setWebViewClient(new WebViewClient() {    
    @Override    
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {    
        handler.proceed();    //表示等待证书响应
      // handler.cancel();      //表示挂起连接，为默认方式
      // handler.handleMessage(null);    //可做其他处理
    }    
});  

// 特别注意：5.1以上默认禁止了https和http混用，以下方式是开启
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
  mWebView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
}
```



### WebChromeClient类

- 作用：辅助 WebView 处理 Javascript 的对话框,网站图标,网站标题等等。

#### 常见使用
**onProgressChanged（）**

- 作用：获得网页的加载进度并显示
```typescript
webview.setWebChromeClient(new WebChromeClient(){

      @Override
      public void onProgressChanged(WebView view, int newProgress) {
          if (newProgress < 100) {
              String progress = newProgress + "%";
              progress.setText(progress);
            } else {
        }
    });
```

**onReceivedTitle（）**

- 作用：获取Web页中的标题
> 每个网页的页面都有一个标题，比如[www.baidu.com](https://links.jianshu.com/go?to=http%3A%2F%2Fwww.baidu.com)这个页面的标题即“百度一下，你就知道”，那么如何知道当前webview正在加载的页面的title并进行设置呢？

```typescript
webview.setWebChromeClient(new WebChromeClient(){

    @Override
    public void onReceivedTitle(WebView view, String title) {
       titleview.setText(title)；
}
```


**onJsAlert（）**

- 作用：支持javascript的警告框
- 一般情况下在 Android 中为 Toast，在文本里面加入\n就可以换行
```typescript
webview.setWebChromeClient(new WebChromeClient() {
            
    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result)  {
        new AlertDialog.Builder(MainActivity.this)
            .setTitle("JsAlert")
            .setMessage(message)
            .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    result.confirm();
                }
            })
            .setCancelable(false)
            .show();
    return true;
}
```

**onJsConfirm（）**

- 作用：支持javascript的确认框
```typescript
webview.setWebChromeClient(new WebChromeClient() {
        
    @Override
    public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
        new AlertDialog.Builder(MainActivity.this)
            .setTitle("JsConfirm")
            .setMessage(message)
            .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    result.confirm();
                }
            })
            .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    result.cancel();
                }
            })
            .setCancelable(false)
            .show();
    // 返回布尔值：判断点击时确认还是取消
    // true表示点击了确认；false表示点击了取消；
    return true;
}
```


**onJsPrompt（）**

- 作用：支持javascript输入框
- 点击确认返回输入框中的值，点击取消返回 null
```typescript
webview.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, final JsPromptResult result) {
        final EditText et = new EditText(MainActivity.this);
        et.setText(defaultValue);
        new AlertDialog.Builder(MainActivity.this)
            .setTitle(message)
            .setView(et)
            .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    result.confirm(et.getText().toString());
                }
            })
            .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    result.cancel();
                }
            })
            .setCancelable(false)
            .show();

    return true;
}
```



# WebView缓存机制及资源预加载
[Carson带你学Android：手把手构建WebView缓存机制及资源预加载方案](https://www.jianshu.com/p/5e7075f4875f)
[GitHub - Carson-Ho/Webview_Cache: WebView的缓存方案：H5缓存机制 + 资源预加载 + 资源拦截](https://github.com/Carson-Ho/Webview_Cache)



这里是一些有的没的，偏题了，不属于核心实现范围，看博客的时候顺便了解一下，这部分看不看无所谓。

## 存在的性能问题
![944365-d0e842a6e92eef2c.webp](/assets/性能问题.webp)
### 渲染速度慢
前端H5页面渲染的速度取决于 两个方面：

- Js 解析效率
Js 本身的解析过程复杂、解析速度不快 & 前端页面涉及较多 JS 代码文件，所以叠加起来会导致 Js 解析效率非常低
- 手机硬件设备的性能
由于Android机型碎片化，这导致手机硬件设备的性能不可控，而大多数的Android手机硬件设备无法达到很好很好的硬件性能

总结：上述两个原因 导致 **H5页面的渲染速度慢**。
### 页面资源加载缓慢
H5 页面从服务器获得，并存储在 Android手机内存里：

- H5页面一般会比较多
- 每加载一个 H5页面，都会产生较多网络请求： 
   1. HTML 主 URL 自身的请求；
   2. HTML外部引用的JS、CSS、字体文件，图片也是一个独立的 HTTP 请求

每一个请求都串行的，这么多请求串起来，这导致 H5页面资源加载缓慢
**总结：H5页面加载速度慢的原因：渲染速度慢 & 页面资源加载缓慢 导致**。

### 耗费流量

- 每次使用 H5页面时，用户都需要重新加载 Android WebView的H5 页面
- 每加载一个 H5页面，都会产生较多网络请求（上面提到）
- 每一个请求都串行的，这么多请求串起来，这导致消耗的流量也会越多



## 解决方案
针对上述Android WebView的性能问题，3种解决方案：

- 前端H5的缓存机制（WebView 自带）
- 资源预加载
- 资源拦截


### 前端H5的缓存机制（WebView 自带）

- 这意味着 H5网页 加载后会存储在缓存区域，在无网络连接时也可访问
- WebView的本质 = 在 Android中嵌入 H5页面，所以，Android WebView自带的缓存机制其实就是 H5页面的缓存机制
- Android WebView除了新的File System缓存机制还不支持，其他都支持

这里介绍两方面：
a. 缓存机制：如何将加载过的网页数据保存到本地
b. 缓存模式：加载网页时如何读取之前保存到本地的网页缓存

#### 浏览器缓存机制
Cache-Control、Expires、Last-Modified & Etag四个字段
**应用场景：**静态资源文件的存储，如JS、CSS、字体、图片等，Android Webview会将缓存的文件记录及文件内容会存在当前 app 的 data 目录中。

**具体实现：**Android WebView内置自动实现，即不需要设置即实现
> 1. Android 4.4后的 WebView 浏览器版本内核：Chrome
> 2. 浏览器缓存机制 是 浏览器内核的机制，一般都是标准的实现



#### Application Cache 缓存机制
**a. 原理**

- 以文件为单位进行缓存，且文件有一定更新机制（类似于浏览器缓存机制）
- AppCache 原理有两个关键点：manifest 属性和 manifest 文件
```typescript
<!DOCTYPE html>
<html manifest="demo_html.appcache">
// HTML 在头中通过 manifest 属性引用 manifest 文件
// manifest 文件：就是上面以 appcache 结尾的文件，是一个普通文件文件，列出了需要缓存的文件
// 浏览器在首次加载 HTML 文件时，会解析 manifest 属性，并读取 manifest 文件，获取 Section：CACHE MANIFEST 下要缓存的文件列表，再对文件缓存
<body>
...
</body>
</html>
```

原理说明如下：
AppCache 在首次加载生成后，也有更新机制。被缓存的文件如果要更新，需要更新 manifest 文件
因为浏览器在下次加载时，除了会默认使用缓存外，还会在后台检查 manifest 文件有没有修改（byte by byte)
发现有修改，就会重新获取 manifest 文件，对 Section：CACHE MANIFEST 下文件列表检查更新
manifest 文件与缓存文件的检查更新也遵守浏览器缓存机制
如用户手动清了 AppCache 缓存，下次加载时，浏览器会重新生成缓存，也可算是一种缓存的更新
AppCache 的缓存文件，与浏览器的缓存文件分开存储的，因为 AppCache 在本地有 5MB（分 HOST）的空间限制

**b. 特点**
方便构建Web App的缓存，专门为 Web App离线使用而开发的缓存机制

**c. 应用场景**
存储静态文件（如JS、CSS、字体文件）

1. 应用场景 同 浏览器缓存机制
2. 但AppCache 是对 浏览器缓存机制 的补充，不是替代。

**d. 具体实现**
```typescript
// 通过设置WebView的settings来实现
WebSettings settings = getSettings();

String cacheDirPath = context.getFilesDir().getAbsolutePath()+"cache/";
settings.setAppCachePath(cacheDirPath);
// 1. 设置缓存路径

 settings.setAppCacheMaxSize(20*1024*1024);
// 2. 设置缓存大小

settings.setAppCacheEnabled(true);
// 3. 开启Application Cache存储机制
    
// 特别注意
// 每个 Application 只调用一次 WebSettings.setAppCachePath() 和 WebSettings.setAppCacheMaxSize()
```


#### Dom Storage 缓存机制
**a. 原理**

- 通过存储字符串的 Key - Value 对来提供
- DOM Storage 分为 sessionStorage & localStorage； 二者使用方法基本相同，区别在于作用范围不同：
   - sessionStorage：具备临时性，即存储与页面相关的数据，它在页面关闭后无法使用
   - localStorage：具备持久性，即保存的数据在页面关闭后也可以使用

**b. 特点**

- 存储空间大（ 5MB）：存储空间对于不同浏览器不同，如Cookies 才 4KB
- 存储安全、便捷： Dom Storage 存储的数据在本地，不需要经常和服务器进行交互
- 不像 Cookies每次请求一次页面，都会向服务器发送网络请求

**c. 应用场景**
存储临时、简单的数据

1. 代替 **将不需要让服务器知道的信息 存储到 cookies** 的这种传统方法
2. Dom Storage 机制类似于 Android 的 SharedPreference机制

**d. 具体实现**
```typescript
// 通过设置 `WebView`的`Settings`类实现
WebSettings settings = getSettings();

settings.setDomStorageEnabled(true); // 开启DOM storage
```


#### Web SQL Database 缓存机制
**a. 原理**

- 基于 SQL 的数据库存储机制



**b. 特点**
充分利用数据库的优势，可方便对数据进行增加、删除、修改、查询

**c. 应用场景**
存储适合数据库的结构化数据

**d. 具体实现**
```typescript
// 通过设置WebView的settings实现
WebSettings settings = getSettings();

String cacheDirPath = context.getFilesDir().getAbsolutePath()+"cache/";
settings.setDatabasePath(cacheDirPath);
// 设置缓存路径

settings.setDatabaseEnabled(true); // 开启 数据库存储机制
```
**特别说明**

- 根据官方说明，Web SQL Database存储机制不再推荐使用（不再维护）
- 取而代之的是 IndexedDB缓存机制，下面会详细介绍

#### IndexedDB 缓存机制
**a. 原理**
属于 NoSQL 数据库，通过存储字符串的 Key - Value 对来提供
类似于 Dom Storage 存储机制 的key-value存储方式

**b. 特点**

1. 功能强大、使用简单：
   - 通过数据库的事务（tranction）机制进行数据操作
   - 可对对象任何属性生成索引，方便查询
2. 存储空间大：
   - 较大的存储空间，默认推荐250MB，比 Dom Storage 的 5MB 要大得多
3. 使用灵活：
   - 以 key-value 的方式存取对象，可以是任何类型值或对象，包括二进制
   - 异步的API调用，避免造成等待而影响体验

**c. 应用场景**
存储 复杂、数据量大的结构化数据

**d. 具体实现**
```typescript
// 通过设置WebView的settings实现
WebSettings settings = getSettings();

settings.setJavaScriptEnabled(true);
// 只需设置支持JS就自动打开IndexedDB存储机制
// Android 在4.4开始加入对 IndexedDB 的支持，只需打开允许 JS 执行的开关就好了。
```

#### 使用建议
<img src="/assets/使用建议.jpg" alt="Snipaste_2024-05-30_19-18-29.jpg" style="zoom: 67%;" />


## 前端H5的缓存模式
缓存模式是一种 当加载 H5网页时 该如何读取之前保存到本地缓存，从而进行使用 的方式
> 即告诉Android WebView 什么时候去读缓存，以哪种方式去读缓存


Android WebView 自带的缓存模式有4种：

- LOAD_CACHE_ONLY: 不使用网络，只读取本地缓存数据
- LOAD_NO_CACHE: 不使用缓存，只从网络获取数据
- LOAD_DEFAULT: （默认）根据cache-control决定是否从网络上取数据 
- LOAD_CACHE_ELSE_NETWORK，只要本地有，无论是否过期，或者no-cache，都使用缓存中的数据

具体使用：
```cpp
WebView.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
// 设置参数即可
```


## 资源预加载
提早加载将需使用的H5页面，即 **提前构建缓存**
> 使用时直接取过来用而不用在需要时才去加载


**资源预加载的应用场景**
对于Android WebView的首页建议使用这种方案，能有效提高首页加载的效率

**具体实现**
预加载WebView对象 & 预加载H5资源

**预加载 WebView 对象**

- 此处主要分为2方面：首次使用的WebView对象 & 后续使用的WebView对象
- 具体如下图

![944365-c14d7fef491bb587.webp](/assets/预加载WebView对象.webp)


**预加载H5资源**
**原理**

1. 在应用启动、初始化第一个WebView对象时，直接开始网络请求加载H5页面
2. 后续需打开这些H5页面时就直接从该本地对象中获取

> a. 从而 事先加载常用的H5页面资源（加载后就有缓存了）
b. 此方法虽然不能减小WebView初始化时间，但数据请求和WebView初始化可以并行进行，总体的页面加载时间就缩短了；缩短总体的页面加载时间

**具体实现**
在Android 的 BaseApplication 里初始化一个 WebView 对象（用于加载常用的H5页面资源）；当需使用这些页面时再从BaseApplication里取过来直接使用


## 资源拦截缓存
为了有效解决 Android WebView 的性能问题，除了使用 Android WebView 自身的缓存机制，还可以自己针对某一需求场景构建缓存机制。

**需求背景**
![2.webp](/assets/资源拦截缓存背景.webp)
**实现步骤**

1. 事先将更新频率较低、常用 & 固定的H5静态资源 文件（如JS、CSS文件、图片等） 放到本地
2. 拦截H5页面的资源网络请求 并进行检测
3. 如果检测到本地具有相同的静态资源 就 直接从本地读取进行替换 而 不发送该资源的网络请求 到 服务器获取
4. 没有相同静态资源的时候再发送网络请求

**具体实现**
重写WebViewClient 的 shouldInterceptRequest 方法，当向服务器访问这些静态资源时进行拦截，检测到是相同的资源则用本地资源代替

```cpp
// 假设现在需要拦截一个图片的资源并用本地资源进行替代
mWebview.setWebViewClient(new WebViewClient() {
    // 重写 WebViewClient  的  shouldInterceptRequest()
    // API 21 以下用shouldInterceptRequest(WebView view, String url)
    // API 21 以上用shouldInterceptRequest(WebView view, WebResourceRequest request)
    // 下面会详细说明

     // API 21 以下用shouldInterceptRequest(WebView view, String url)
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {

        // 步骤1:判断拦截资源的条件，即判断url里的图片资源的文件名
        if (url.contains("logo.gif")) {
        // 假设网页里该图片资源的地址为：http://abc.com/imgage/logo.gif
        // 图片的资源文件名为:logo.gif

            InputStream is = null;
            // 步骤2:创建一个输入流

            try {
                is =getApplicationContext().getAssets().open("images/abc.png");
                // 步骤3:获得需要替换的资源(存放在assets文件夹里)
                // a. 先在app/src/main下创建一个assets文件夹
                // b. 在assets文件夹里再创建一个images文件夹
                // c. 在images文件夹放上需要替换的资源（此处替换的是abc.png图片）

            } catch (IOException e) {
                e.printStackTrace();
            }

            // 步骤4:替换资源
            WebResourceResponse response = new WebResourceResponse("image/png",
                    "utf-8", is);
            // 参数1：http请求里该图片的Content-Type,此处图片为image/png
            // 参数2：编码类型
            // 参数3：存放着替换资源的输入流（上面创建的那个）
            return response;
        }

        return super.shouldInterceptRequest(view, url);
    }

    
   // API 21 以上用shouldInterceptRequest(WebView view, WebResourceRequest request)
    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {

           // 步骤1:判断拦截资源的条件，即判断url里的图片资源的文件名
            if (request.getUrl().toString().contains("logo.gif")) {
            // 假设网页里该图片资源的地址为：http://abc.com/imgage/logo.gif
            // 图片的资源文件名为:logo.gif

                InputStream is = null;
                // 步骤2:创建一个输入流

                try {
                    is = getApplicationContext().getAssets().open("images/abc.png");
                     // 步骤3:获得需要替换的资源(存放在assets文件夹里)
                    // a. 先在app/src/main下创建一个assets文件夹
                    // b. 在assets文件夹里再创建一个images文件夹
                    // c. 在images文件夹放上需要替换的资源（此处替换的是abc.png图片

                } catch (IOException e) {
                    e.printStackTrace();
                }

                // 步骤4:替换资源
                WebResourceResponse response = new WebResourceResponse("image/png",
                        "utf-8", is);
                // 参数1：http请求里该图片的Content-Type,此处图片为image/png
                // 参数2：编码类型
                // 参数3：存放着替换资源的输入流（上面创建的那个）
                return response;
            }
            return super.shouldInterceptRequest(view, request);
        }

});
```



# WebView漏洞
[Carson带你学Android：盘点那些你不知道的WebView漏洞](https://www.jianshu.com/p/3a345d27cd42)

![3.webp](/assets/漏洞.webp)
WebView中，主要漏洞有三类：

- 任意代码执行漏洞
- 密码明文存储漏洞
- 域控制不严格漏洞


## 任意代码执行漏洞
出现该漏洞的原因有三个：

- WebView 中 addJavascriptInterface() 接口
- WebView 内置导出的 searchBoxJavaBridge_对象
- WebView 内置导出的 accessibility 和 accessibilityTraversalObject 对象

### addJavascriptInterface 接口引起远程代码执行漏洞
**漏洞产生原因**
JS调用Android的其中一个方式是通过 addJavascriptInterface 接口进行对象映射：
```cpp
 webView.addJavascriptInterface(new JSObject(), "myObj");
// 参数1：Android的本地对象(其实就是JSBridge)
// 参数2：JS的对象
// 通过对象映射将Android中的本地对象和JS中的对象进行关联，从而实现JS调用Android的对象和方法
```
**所以，漏洞产生原因是：当JS拿到Android这个对象后，就可以调用这个Android对象中所有的方法，包括系统类（java.lang.Runtime 类），从而进行任意代码执行。**
如可以执行命令获取本地设备的SD卡中的文件等信息从而造成信息泄露.

**具体攻击方法**
具体获取系统类的描述：（结合 Java 反射机制）

- Android中的对象有一公共的方法：getClass() ；
- 该方法可以获取到当前类 类型Class
- 该类有一关键的方法： Class.forName；
- 该方法可以加载一个类（可加载 java.lang.Runtime 类）
- 而该类是可以执行本地命令的
```cpp
function execute(cmdArgs)  
{  
    // 步骤1：遍历 window 对象
    // 目的是为了找到包含 getClass （）的对象
    // 因为Android映射的JS对象也在window中，所以肯定会遍历到
    for (var obj in window) {  
        if ("getClass" in window[obj]) {  

      // 步骤2：利用反射调用forName（）得到Runtime类对象
            alert(obj);          
            return  window[obj].getClass().forName("java.lang.Runtime")  

      // 步骤3：以后，就可以调用静态方法来执行一些命令，比如访问文件的命令
        getMethod("getRuntime",null).invoke(null,null).exec(cmdArgs);  

        // 从执行命令后返回的输入流中得到字符串，有很严重暴露隐私的危险。
        // 如执行完访问文件的命令之后，就可以得到文件名的信息了。
        }  
    }  
}   
```

- 当一些 APP 通过扫描二维码打开一个外部网页时，攻击者就可以执行这段 js 代码进行漏洞攻击。
- 在微信盛行、扫一扫行为普及的情况下，该漏洞的危险性非常大

**解决方案**
Android 4.2版本之后：
Google 在Android 4.2 版本中规定对被调用的函数以 @JavascriptInterface 进行注解从而避免漏洞攻击

Android 4.2版本之前的这里不做说明，毕竟自己是前端开发

### searchBoxJavaBridge_接口引起远程代码执行漏洞
**漏洞产生原因**

- 在Android 3.0以下，Android系统会默认通过searchBoxJavaBridge_的Js接口给 WebView 添加一个JS映射对象：searchBoxJavaBridge_对象
- 该接口可能被利用，实现远程任意代码。



**解决方案**
删除 searchBoxJavaBridge_ 接口
```cpp
// 通过调用该方法删除接口
removeJavascriptInterface();
```

### accessibility和 accessibilityTraversal接口引起远程代码执行漏洞
问题分析与解决方案同上，这里不作过多阐述。



## 密码明文存储漏洞
**问题分析**
WebView默认开启密码保存功能 ：
```bash
mWebView.setSavePassword(true)
```

- 开启后，在用户输入密码时，会弹出提示框：询问用户是否保存密码；
- 如果选择”是”，密码会被明文保到 /data/data/com.package.name/databases/webview.db 中，这样就有被盗取密码的危险

**解决方案**
关闭密码保存提醒
```bash
WebSettings.setSavePassword(false)
```

## 域控制不严格漏洞
**问题分析**
先看Android里的 WebViewActivity.java：
```java
public class WebViewActivity extends Activity {
    private WebView webView;
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_webview);
        webView = (WebView) findViewById(R.id.webView);

        //webView.getSettings().setAllowFileAccess(false);                    (1)
        //webView.getSettings().setAllowFileAccessFromFileURLs(true);         (2)
        //webView.getSettings().setAllowUniversalAccessFromFileURLs(true);    (3)
        Intent i = getIntent();
        String url = i.getData().toString(); //url = file:///data/local/tmp/attack.html 
        webView.loadUrl(url);
    }
}

/**Mainifest.xml**/
// 将该 WebViewActivity 在Mainifest.xml设置exported属性
// 表示：当前Activity是否可以被另一个Application的组件启动
android:exported="true"
```
即 A 应用可以通过 B 应用导出的 Activity 让 B 应用加载一个恶意的 file 协议的 url，从而可以获取 B 应用的内部私有文件，从而带来数据泄露威胁
> 具体：当其他应用启动此 Activity 时， intent 中的 data 直接被当作 url 来加载（假定传进来的 url 为 file:///data/local/tmp/attack.html ），其他 APP 通过使用显式 ComponentName 或者其他类似方式就可以很轻松的启动该 WebViewActivity 并加载恶意url


下面我们着重分析 WebView 中 getSettings 类的方法对 WebView 安全性的影响：

- setAllowFileAccess()
- setAllowFileAccessFromFileURLs()
- setAllowUniversalAccessFromFileURLs()

**setAllowFileAccess()**
```java
// 设置是否允许 WebView 使用 File 协议
webView.getSettings().setAllowFileAccess(true);     
// 默认设置为true，即允许在 File 域下执行任意 JavaScript 代码
```

使用 file 域加载的 js代码能够使用进行**同源策略跨域访问**，从而导致隐私信息泄露

1. 同源策略跨域访问：对私有目录文件进行访问
2. 针对 IM 类产品，泄露的是聊天信息、联系人等等
3. 针对浏览器类软件，泄露的是cookie 信息泄露

如果不允许使用 file 协议，则不会存在上述的威胁；
```java
webView.getSettings().setAllowFileAccess(true);     
```
但同时也限制了 WebView 的功能，使其不能加载本地的 html 文件，如下图：
> 移动版的 Chrome 默认禁止加载 file 协议的文件

![11.webp](/assets/notFound.webp)

**解决方案：**

- 对于不需要使用 file 协议的应用，禁用 file 协议；
```bash
setAllowFileAccess(false);
```

- 对于需要使用 file 协议的应用，禁止 file 协议加载 JavaScript
```swift
setAllowFileAccess(true); 

// 禁止 file 协议加载 JavaScript
if (url.startsWith("file://") {
    setJavaScriptEnabled(false);
} else {
    setJavaScriptEnabled(true);
}
```



**setAllowFileAccessFromFileURLs()**
```swift
// 设置浏览器是否允许通过 file url 加载的 Js代码读取其他的本地文件
webView.getSettings().setAllowFileAccessFromFileURLs(true);
// 在Android 4.1前默认允许
// 在Android 4.1后默认禁止
```

**setAllowUniversalAccessFromFileURLs()**
```swift
// 设置是否允许通过 file url 加载的 Javascript 可以访问其他的源(包括http、https等源)
webView.getSettings().setAllowUniversalAccessFromFileURLs(true);

// 在Android 4.1前默认允许（setAllowFileAccessFromFileURLs（）不起作用）
// 在Android 4.1后默认禁止
```

**setJavaScriptEnabled()🎯**
```swift
// 设置是否允许 WebView 使用 JavaScript（默认是不允许）
webView.getSettings().setJavaScriptEnabled(true);  
```
但很多应用（包括移动浏览器）为了让 WebView 执行 http 协议中的 JavaScript，都会主动设置为true，不区别对待是非常危险的。

即使把setAllowFileAccessFromFileURLs（）和setAllowUniversalAccessFromFileURLs（）都设置为 false，通过 file URL 加载的 javascript 仍然有方法访问其他的本地文件：**符号链接跨源攻击**
> 前提是允许 file URL 执行 javascript，即 webView.getSettings().setJavaScriptEnabled(true);


这一攻击能奏效的原因是：**通过 javascript 的延时执行和将当前文件替换成指向其它文件的软链接就可以读取到被符号链接所指的文件**。具体攻击步骤：

1. 把恶意的 js 代码输出到攻击应用的目录下，随机命名为 xx.html，修改该目录的权限；
2. 修改后休眠 1s，让文件操作完成；
3. 完成后通过系统的 Chrome 应用去打开该 xx.html 文件
4. 等待 4s 让 Chrome 加载完成该 html，最后将该 html 删除，并且使用 ln -s 命令为 Chrome 的 Cookie 文件创建软连接
> 注：在该命令执行前 xx.html 是不存在的；执行完这条命令之后，就生成了这个文件，并且将 Cookie 文件链接到了 xx.html 上

于是就可通过链接来访问 Chrome 的 Cookie
> - Google 没有进行修复，只是让Chrome 最新版本默认禁用 file 协议，所以这一漏洞在最新版的 Chrome 中并不存在
> - 但是，在日常大量使用 WebView 的App和浏览器，都有可能受到此漏洞的影响。通过利用此漏洞，容易出现数据泄露的危险

如果是 file 协议，禁用 javascript 可以很大程度上减小跨源漏洞对 WebView 的威胁。
> - 但并不能完全杜绝跨源文件泄露。
> - 例：应用实现了下载功能，对于无法加载的页面，会自动下载到 sd 卡中；由于 sd 卡中的文件所有应用都可以访问，于是可以通过构造一个 file URL 指向被攻击应用的私有文件，然后用此 URL 启动被攻击应用的 WebActivity，这样由于该 WebActivity 无法加载该文件，就会将该文件下载到 sd 卡下面，然后就可以从 sd 卡上读取这个文件了


**最终解决方案**

- 对于不需要使用 file 协议的应用，禁用 file 协议；
```swift
// 禁用 file 协议；
setAllowFileAccess(false); 
setAllowFileAccessFromFileURLs(false);
setAllowUniversalAccessFromFileURLs(false);
```

- 对于需要使用 file 协议的应用，禁止 file 协议加载 JavaScript
```swift
// 需要使用 file 协议
setAllowFileAccess(true); 
setAllowFileAccessFromFileURLs(false);
setAllowUniversalAccessFromFileURLs(false);

// 禁止 file 协议加载 JavaScript
if (url.startsWith("file://") {
    setJavaScriptEnabled(false);
} else {
    setJavaScriptEnabled(true);
}
```



# 离线资源包加载

## 思路
将页面需要的静态资源打包并预先加载到客户端的安装包中，当用户安装时，再将资源解压到本地存储中，当 WebView 加载某个 H5 页面时，拦截发出的所有 http 请求，查看请求的资源是否在本地存在，如果存在则直接返回资源。
将该资源映射的 json 文件和需要本地化的静态资源打包成 zip 包，以供后面的流程使用（这个打成zip包使用vite plugin）。

```swift
{
  "packageId": "mwbp",
  "version": 1,
  "items": [
    {
      "packageId": "mwbp",
      "version": 1,
      "remoteUrl": "http://122.51.132.117/js/app.67073d65.js",
      "path": "js/app.67073d65.js",
      "mimeType": "application/javascript"
    },
    ...
  ]
}
```
其中 remoteUrl 是该资源在静态资源服务器的地址，path 则是在客户端本地的相对路径（通过拦截该资源对应的服务端请求，并根据相对路径从本地命中相关资源然后返回）。


第一个版本可以先预置到客户端安装包里，同时将该新的离线包上传到离线包管理平台中，该平台除了保存离线包文件和相关信息之外，还会生成一个名为 packageIndex 的 json 文件，即记录所有相关离线包信息集合的文件，该文件主要是提供给客户端下载的。大致内容如下：
```swift
{
  "data": [
    {
      "module_name": "main",
      "version": 2,
      "status": 1,
      "origin_file_path": "/download/main/07eb239072934103ca64a9692fb20f83",
      "origin_file_md5": "ec624b2395a479020d02262eee36efe4",
      "patch_file_path": "/download/main/b4b8e0616e75c0cc6f34efde20fb6f36",
      "patch_file_md5": "6863cdacc8ed9550e8011d2b6fffdaba"
    }
  ],
  "errorCode": 0
}
```

前端打包出一个新的离线包。这个时候我们就可以将这个离线包上传到管理平台，此时 packageIndex 中离线包 main 的版本就会更新成 2。
当客户端启动并请求最新的 packageIndex 文件时，发现离线包 main 的版本比本地对应离线包的版本大时，会从离线包平台下载最新的版本，并以此作为查询本地静态资源文件的资源池。

当上传版本为 2 的离线包到管理平台时，平台会与之前保存的版本为 1 的离线包进行 diff ，算出 1 到 2 的差分包。而客户端仅仅需要下载差分包，然后同样使用基于 bsdiff 算法的工具，和本地版本 1 的离线包进行 patch 生成版本 2 的离线包。



先执行 MWBPApplication.java，其中会先初始化 PackageManager。
此时会打印
```swift
PackageManager  init
```
init 方法会初始化一些有的没的，并决定是否需要加载离线包，如果需要会开一个离线包线程，然后**获取预置在assets中的离线包并解压到相应目录，获取离线包方法：**performLoadAssets
加载完本地离线包后会 更新本地 packageIndex.json 的版本号。

接着执行 MWBPApplication 中的 getPackageIndex，获取 package index（包索引），然后**通过 EventBus 发布获取到的数据**，此时 packageManager 就会**订阅**该方法，此时触发 update 方法

注：init方法加载本地离线包 和 getPackageIndex 这两个方法是同时进行的，加载离线包时间较长，另开一个线程去加载本地离线包。



接着执行 MainActivity.java，无特殊说明

接着执行 OfflineWebViewClient.java , 拦截请求

所以是刚打开APP 就去 请求 packageIndex，如果发现不一致，则下载差分包，然后合并
**之后拦截请求，拦截的请求直接用本地的资源，**日志代码在：library模块的 OfflineWebViewClient.java 文件





## Vite 插件

vite 插件负责将 H5 build 之后的内容打包成一个 zip，同时将 资源映射的 json 文件 也放入 zip 中。

plugin实现思路：主要是监听 vite 插件的 closeBundle 钩子（即在生成资源放入dist目录之前），遍历读取打包生成的资源，然后将每个资源（可通过文件类型限定遍历范围）的信息记录在一个资源映射的 json 里, 同时将资源放入 zip 中

```
// index.json
{
  "packageId": "package",
  "version": 2,
  "items": [
    {
      "packageId": "package",
      "version": 2,
      "remoteUrl": "http://192.168.1.7:3000/index-DiwrgTda.css",
      "path": "index-DiwrgTda.css",
      "mimeType": "text/css"
    },
    {
      "packageId": "package",
      "version": 2,
      "remoteUrl": "http://192.168.1.7:3000/index-Dyq6MLV9.js",
      "path": "index-Dyq6MLV9.js",
      "mimeType": "application/javascript"
    },
    {
      "packageId": "package",
      "version": 2,
      "remoteUrl": "http://192.168.1.7:3000/index.html",
      "path": "index.html",
      "mimeType": "text/html"
    },
    {
      "packageId": "package",
      "version": 2,
      "remoteUrl": "http://192.168.1.7:3000/vite.svg",
      "path": "vite.svg",
      "mimeType": "image/svg+xml"
    }
  ]
}
```







## 差分包
如果前端仅仅是改动了某一处，客户端仍旧需要下载完整的新包，岂不是很浪费流量同时也延长了文件下载的时间？

针对这个问题我们可以使用一个文件差分工具 - [bsdiff-nodejs](https://github.com/Exoway/bsdiff-nodejs)，该 node 工具调用了 c 语言实现的 bsdiff 算法（基于二进制进行文件比对算出 diff/patch 包）。当上传版本为 2 的离线包到管理平台时，平台会与之前保存的版本为 1 的离线包进行 diff ，算出 1 到 2 的差分包。而客户端仅仅需要下载差分包，然后同样使用基于 bsdiff 算法的工具，和本地版本 1 的离线包进行 patch 生成版本 2 的离线包。



- [https://www.npmjs.com/package/bsdiff-nodejs?activeTab=readme](https://www.npmjs.com/package/bsdiff-nodejs?activeTab=readme)
- [https://github.com/gaetandezeiraud/bsdiff-node/issues/7](https://github.com/gaetandezeiraud/bsdiff-node/issues/7)



**安装**
[https://segmentfault.com/a/1190000023271417](https://segmentfault.com/a/1190000023271417)

```swift
npm i bsdiff-nodejs

npm config set python "D:\Python27\python.exe"
npm config set node_gyp "D:\nodejs\node_modules\node-gyp\bin\node-gyp.js"
```



- bsdiff-node: [https://www.npmjs.com/package/bsdiff-node?activeTab=readme](https://www.npmjs.com/package/bsdiff-node?activeTab=readme)👍🏻

- bsdiff-nodejs: [https://www.npmjs.com/package/bsdiff-nodejs?activeTab=readme](https://www.npmjs.com/package/bsdiff-nodejs?activeTab=readme)

  

  

现在有两种：bsdiff-node 和 bsdiff-nodejs

- 原项目中用的是bsdiff-nodejs，要求 pathon2.7.15，我安装不上

- 改成了 bsdiff-node，要求 python3.x

  


**使用**
```typescript
const path = require('path');

const oldFile = path.join(__dirname, 'resources/react-0.3-stable.zip'); // 旧版本文件的路径
const newFile = path.join(__dirname, 'resources/react-0.4-stable.zip'); // 新版本文件的路径
const patchFile = path.join(__dirname, 'resources/react.patch'); // 即将生成的差异补丁文件的路径
const generatedFile = path.join(__dirname, 'resources/react-generated.zip'); // 通过应用差异补丁生成的新文件的路径

async function asyncCall() {
  // diff 方法：生成补丁
  await bsdiff.diff(oldFile, newFile, patchFile, function (result) {
    console.log('diff:' + String(result).padStart(4) + '%');
  });

  // patch: 应用补丁
  await bsdiff.patch(oldFile, generatedFile, patchFile, function (result) {
    console.log('patch:' + String(result).padStart(4) + '%');
  });
  // function (result)：回调函数，用于处理 diff 方法的结果。result 表示生成补丁的进度或结果，将其转换为字符串并打印出来。
}

asyncCall()
```







# QA

- [ ] 每次使用vite plugin都需要手动更改版本号，在真实开发中，这不现实