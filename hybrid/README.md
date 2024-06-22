# 🚀Hybrid 混合开发实践
<hr/>

# 实现思路
分成三步走：
- [x] 了解 android 中如何嵌入 H5（使用 webView）
- [x] 原生 和 H5 的 通信原理（JSBridge）
- [ ] webView 的 离线资源包更新


# 一些参考文章/代码/视频
## JSBridge
1. https://github.com/mcuking/JSBridge
2. https://github.com/mcuking/blog/issues/39

## webview
1. https://www.jianshu.com/p/345f4d8a5cfa
2. bilibili —— 天哥在奔跑-webview小节
3. https://www.bilibili.com/video/BV12t411L7Pn/?spm_id_from=333.999.0.0&vd_source=cb0f2ca83acbbbf237e17c761cf7bc37
4. https://juejin.cn/post/7348824894157160474#heading-0

## 离线资源包
1. https://www.cnblogs.com/yexiaochai/p/4921635.html
2. https://www.cnblogs.com/yexiaochai/p/5524783.html
3. https://juejin.cn/post/6844903546073120775?searchId=20240331093211C01BF4CE81E56FBB326E#heading-5
4. https://juejin.cn/post/6949103404266291231#heading-8
5. https://juejin.cn/post/6844903425721761799#heading-10
6. https://juejin.cn/post/6844904049448321032#heading-15
7. https://github.com/mcuking/blog/issues/63
8. https://github.com/free46000/HybridFoundation
9. https://juejin.cn/post/7119662876578545678?searchId=20240531163728F7C354948163FD0DC56D#heading-3
10. https://github.com/mcuking/mobile-web-best-practice-container


# webView 嵌入 H5
参考文章：[Carson带你学Android：全面总结WebView与 JS 的交互方式](https://www.jianshu.com/p/345f4d8a5cfa)

分成三部分讲解：
- Webview类自身的常见方法（加载资源）
- Webview的最常用的工具类：WebSettings类、WebViewClient类、WebChromeClient类
- Android 和 Js的交互

![](/images/1.1.webp)


## Webview类常用方法

### 加载资源
加载方式根据资源分为三种
```js
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
```js
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
```js
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
```js
public boolean onKeyDown(int keyCode, KeyEvent event) {
    if ((keyCode == KEYCODE_BACK) && mWebView.canGoBack()) { 
        mWebView.goBack();
        return true;
    }
    return super.onKeyDown(keyCode, event);
}
```

### 清除缓存数据
```js
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
step1: 添加访问网络权限（AndroidManifest.xml）
```
<uses-permission android:name="android.permission.INTERNET"/>
```

step2: 生成一个WebView组件（有两种方式）
```js
//方式1：直接在在Activity中生成
WebView webView = new WebView(this)

//方法2：在Activity的layout文件里添加webview控件：
WebView webview = (WebView) findViewById(R.id.webView1);
```

step3: 进行配置-利用WebSettings子类（常见方法）
```js
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
```js
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


**结合使用（离线加载）**
```js
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
注意： 每个 Application 只调用一次 WebSettings.setAppCachePath()，WebSettings.setAppCacheMaxSize()



### WebViewClient类
- 作用：处理各种通知 & 请求事件

#### 常用方法
**shouldOverrideUrlLoading()**
- 作用：打开网页时不调用系统浏览器， 而是在本WebView中显示；在网页上的所有加载都经过这个方法,这个函数我们可以做很多操作。
```js
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
```js
webView.setWebViewClient(new WebViewClient(){
     @Override
     public void  onPageStarted(WebView view, String url, Bitmap favicon) {
        //设定加载开始的操作
     }
});
```

**onPageFinished()**
- 作用：在页面加载结束时调用。我们可以关闭loading 条，切换程序动作。
```js
webView.setWebViewClient(new WebViewClient(){
      @Override
      public void onPageFinished(WebView view, String url) {
         //设定加载结束的操作
      }
});
```


**onLoadResource()**
- 作用：在加载页面资源时会调用，每一个资源（比如图片）的加载都会调用一次。
```js
webView.setWebViewClient(new WebViewClient(){
    @Override
    public boolean onLoadResource(WebView view, String url) {
       //设定加载资源的操作
    }
});
```


**onReceivedError()**
- 作用：加载页面的服务器出现错误时（如404）调用。
  
> App里面使用webview控件的时候遇到了诸如404这类的错误的时候，若也显示浏览器里面的那种错误提示页面就显得很丑陋了，那么这个时候我们的app就需要加载一个本地的错误提示页面，即webview如何加载一个本地的页面

```js
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
```js
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
**onProgressChanged()**
- 作用：获得网页的加载进度并显示
```js
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


**onReceivedTitle()**
- 作用：获取Web页中的标题
> 每个网页的页面都有一个标题，比如www.baidu.com这个页面的标题即“百度一下，你就知道”，那么如何知道当前webview正在加载的页面的title并进行设置呢？

```js
webview.setWebChromeClient(new WebChromeClient(){

    @Override
    public void onReceivedTitle(WebView view, String title) {
       titleview.setText(title)；
}
```


**onJsAlert()**
- 作用：支持javascript的警告框
- 一般情况下在 Android 中为 Toast，在文本里面加入\n就可以换行
```js
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

**onJsConfirm()**

- 作用：支持javascript的确认框
```js
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

**onJsPrompt()**
- 作用：支持javascript输入框
- 点击确认返回输入框中的值，点击取消返回 null
```
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


