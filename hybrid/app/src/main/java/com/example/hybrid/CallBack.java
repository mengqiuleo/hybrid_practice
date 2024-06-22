package com.example.hybrid;

import android.util.Log;
import android.webkit.ValueCallback;
import android.webkit.WebView;

import org.json.JSONObject;

public class CallBack {
    private String cbName;
    private WebView myWebView;

    public CallBack(WebView webView, String cbName) {
        this.cbName = cbName;
        this.myWebView = webView;
    }

    public void apply(JSONObject jsonObject) {

        if (myWebView != null) {
            Log.i("cb", "执行回调" + cbName); // 执行例如：javascript: CALLBACK1()
            myWebView.post(() -> {
                myWebView.evaluateJavascript("javascript:" + cbName + "(" + jsonObject.toString() + ")", new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        return;
                    }
                });
            });
            Log.i("cb", "回调结束" + cbName);
        }
    }
}
