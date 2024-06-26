package com.example.webpackagekit.webpackagekit;

import android.annotation.TargetApi;
import android.os.Build;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class OfflineWebViewClient extends WebViewClient {
    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    @Override
    // 通过对 WebviewClient 类的 shouldInterceptRequest 方法的复写来拦截 http 请求，并从本地查找是否有相应的前端静态资源，如果有则直接返回
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        final String url = request.getUrl().toString();
        Log.d("shouldInterceptRequest", "拦截 http 请求" + url);
        WebResourceResponse resourceResponse = getWebResourceResponse(url);
        if (resourceResponse == null) {
            // request fpackagerom remote , https://mcuking.github.io/mobile-web-best-practice/lib/moment/2.24.0/moment.min.js
            Log.d("WebViewClient", "request from remote , " + url);
            return super.shouldInterceptRequest(view, request);
        }
        Log.d("WebViewClient", "request from local , " + url);
        return resourceResponse;
    }

    /**
     * 从本地命中并返回资源
     * @param url 资源地址
     */
    private WebResourceResponse getWebResourceResponse(String url) {
        try {
            WebResourceResponse resourceResponse = PackageManager.getInstance().getResource(url);
            return resourceResponse;
        } catch (Exception e) {
            Log.e("Error", e.toString());
            e.printStackTrace();
        }
        return null;
    }
}
