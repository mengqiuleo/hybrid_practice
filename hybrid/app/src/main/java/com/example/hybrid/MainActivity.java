package com.example.hybrid;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.example.webpackagekit.webpackagekit.OfflineWebViewClient;

import java.security.Key;

public class MainActivity extends AppCompatActivity {

    private Button btn1;
    private View.OnClickListener btnonClickHandler = new View.OnClickListener() {
        @Override
        public void onClick(View v) {
            Toast.makeText(MainActivity.this, "测试toast", Toast.LENGTH_SHORT).show();
            // 原生调用 H5 的方法
            wv.loadUrl("javascript:getData('原生 传给 H5')");
        }
    };

    private WebView wv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        //
        initView();
    }

    private void initView() {
        btn1 = (Button) findViewById(R.id.btn1);

        // 增加监听事件
        btn1.setOnClickListener(btnonClickHandler);

        wv = (WebView) findViewById(R.id.wv);



        /*
         *  wv.loadUrl()
         *  webView.loadUrl('https://m.jd.com) 加载远程页面
         *  webView.loadUrl("file:///android_asset/test.html") // 本地页面（离线资源包）
         *  webView.loadUrl("content://com.android.hybrid/sdcard/test.html") // 手机SD卡的页面
         *  */

        // 首先，配置webView 设置
        wvSetting();

        // webView 会默认打开手机自带的浏览器去执行超链接，但我们希望在 webView 中打开
        /*
         * 如果希望点击超链接时不跳转浏览器，必须覆盖 webView 的 WebViewClient 对象
         * 新建两个对象 MyWebViewClient 和 MyWebChromeClient , 他们分别继承自 WebViewClient 和 WebChromeClient
         *
         * PS:
         *   Android WebView 作为承载网页的载体控件，它在网页显示过程中会产生一些事件，并回调给我们的应用程序，以便我们在网页加载过程中做应用程序想处理的事情
         *   比如客户端需要显示网页加载的进度、网页加载发生错误等。
         *
         * WebView 提供两个事件回调类给应用层，分别为 WebViewClient、WebChromeClient，开发者可以继承这两个类，接手相应事件处理。
         * WebViewClient 主要提供网页加载各个阶段的通知，比如网页开始加载 onPageStarted，网页加载结束 onPageFinish 等。
         * WebChromeClient 主要提供网页加载过程中提供的数据内容，比如返回网页的 title、favicon等。
         */
        wvClientSetting();

        // 加载远程页面
        // 初次加载显示无网络，需要到项目配置文件中添加网络的权限
        // wv.loadUrl("https://m.jd.com");

        // part1
        // 加载本地页面
        // wv.loadUrl("file:///android_asset/index_old.html");
        // 加载本地页面: 通信 （给 WebView 容器注入全局变量并挂载在 window 对象上）: 旧的 JSBridge
        // wv.addJavascriptInterface(new OldJSBridge(getApplicationContext()), "MyJSBridge");


        // part2:
//        wv.loadUrl("file:///android_asset/index.html");
        // 现在忘记旧的，使用新的JSBridge
        JSBridge.register("JSBridge", NativeMethods.class);
        /*
         *  JSBridge 的 register 可以注册多个 原生方法class类。比如：
         *  JSBridge.register("JSBridge", NativeMethods.class);
         *  JSBridge.register("Weex", NativeMethods_W.class);
         *  JSBridge.register("Dejavu", NativeMethods_D.class);
         *
         *  然后每个 class类 对应多个 方法
         *  NativeMethods.class {
         *      1. showToast
         *      2. showToastParma
         *      3. usePhoto
         *  }
         */
        wv.addJavascriptInterface(new JSBridge(wv), "_jsbridge");



        // 获取 app 版本
        PackageManager packageManager = getPackageManager();
        PackageInfo packInfo = null;
        try {
            // getPackageName()是你当前类的包名，0代表是获取版本信息
            packInfo = packageManager.getPackageInfo(getPackageName(),0);

            // packInfo信息: PackageInfo{91df65f com.example.hybrid}
            Log.d("getPackageIndex", "packInfo信息: " + packInfo);
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        assert packInfo != null;
        String appVersion = packInfo.versionName;


        // 获取系统版本
        String systemVersion = android.os.Build.VERSION.RELEASE;

        // app的版本: 1.0 系统版本: 11
        Log.d("getPackageIndex", "app的版本: " + appVersion + "系统版本: " + systemVersion);

        WebSettings webSettingsOver = wv.getSettings();
        webSettingsOver.setUserAgentString(
                webSettingsOver.getUserAgentString() + " DSBRIDGE_"  + appVersion + "_" + systemVersion + "_android"
        );
        // part3: 测试离线包
//        wv.loadUrl("https://mcuking.github.io/mobile-web-best-practice/");
//        wv.loadUrl("http://127.0.0.1:5174");
        wv.loadUrl("http://192.168.1.7:5174");
        // 这里需要使用本机的IP地址，而不是 localhost (命令：ipconfig), 且要解决安卓不允许使用 http ，而是https
    }

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

    private void wvClientSetting() {
        // 处理页面加载各个阶段
        MyWebViewClient myWebViewClient = new MyWebViewClient(wv, getApplicationContext());
//        wv.setWebViewClient(myWebViewClient);
        // 复写 WebviewClient 类（引入离线包的类）
        wv.setWebViewClient(new OfflineWebViewClient());

        // 提供网页加载过程中提供的数据内容
        MyWebChromeClient myWebChromeClient = new MyWebChromeClient(getApplicationContext());
        wv.setWebChromeClient(myWebChromeClient);
    }

    private void wvSetting() {
        // 声明 WebSettings 子类
        WebSettings webSettings = wv.getSettings();
        // 如果访问的页面中要与JavaScript交互，则webView必须设置支持JavaScript
        webSettings.setJavaScriptEnabled(true);
        // 若加载的html里有JS在执行动画等操作，会造成资源浪费（CPU，电量）
        // 在 onStep 和 onResume 里分别把 setJavaScriptEnabled() 给设置成 false 和 true 即可
        // 设置自适应屏幕，两者合用
        webSettings.setUseWideViewPort(true); // 将图片调整到适合 webView 的大小
        webSettings.setLoadWithOverviewMode(true); // 缩放至屏幕的大小
        // 缩放操作
        webSettings.setSupportZoom(true); // 支持缩放，默认为 true 是下面那个的前提
        webSettings.setBuiltInZoomControls(true); // 设置内置的缩放控件，若为false，则该 webView 不可缩放
        webSettings.setDisplayZoomControls(false); // 隐藏原生的缩放控件
        // 其他细节操作
        webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); // 关闭 webView 中缓存
        webSettings.setAllowFileAccess(true); // 设置可以访问文件
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true); // 支持通过JS打开新窗口
        webSettings.setLoadsImagesAutomatically(true); // 支持自动加载图片
        webSettings.setDefaultTextEncodingName("uft-8"); // 设置编码格式
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && wv.canGoBack()) {
            wv.goBack();
            return  true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() { // 在退出activity时，别忘了销毁WebView
        if (wv != null) {
            final ViewGroup viewGroup = (ViewGroup) wv.getParent();
            if (viewGroup != null) {
                viewGroup.removeView(wv);
            }
            wv.destroy();
        }

        super.onDestroy();
    }
}