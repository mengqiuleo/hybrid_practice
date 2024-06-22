package com.example.hybrid;

import android.net.Uri;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;

public class JSBridge {
    // JSBridge 主要有两个方法：
    // 1. call: H5 调用原生方法
    // 2. register: 给原生注册方法
    private final WebView myWebView;

    public JSBridge(WebView webView) {
        this.myWebView = webView;
    }

    private static final Map<String, HashMap<String, Method>> exposeMethods = new HashMap<>();

    public static void register(String exposeName, Class<?> classz) {
        if (!exposeMethods.containsKey((exposeName))) {
           exposeMethods.put(exposeName, getAllMethod(classz));
        }
    }

    private static HashMap<String, Method> getAllMethod(Class injectedCls) {
        HashMap<String, Method> methodHashMap = new HashMap<>();

        Method[] methods = injectedCls.getDeclaredMethods();

        for (Method method: methods) {
            if (method.getModifiers() != (Modifier.PUBLIC | Modifier.STATIC) || method.getName() == null) {
                continue;
            }
            Class[] parameters = method.getParameterTypes();
            if (parameters!=null && parameters.length==3) {
                if (parameters[0] == WebView.class && parameters[1] == JSONObject.class && parameters[2] == CallBack.class) {
                    methodHashMap.put(method.getName(), method);
                }
            }
        }

        return methodHashMap;
    }

    @JavascriptInterface
    public String call(String methodName, String args) {
        /*
         * window._JSBridge.call(method, JSON.stringify(args));
         */
        try {
            JSONObject _args = new JSONObject(args);
            JSONObject arg = new JSONObject(_args.getString("data"));
            String cbName = _args.getString("cbName");


            /*
             * window._JSBridge 使用 call 方法调用时，因为可以有多个 register, 所以需要两层校验，
             * 第一层检验有没有 register，
             * 第二层校验该 register 中有没有对应方法
             */
            if (exposeMethods.containsKey("JSBridge")) {
                HashMap<String, Method> methodHashMap = exposeMethods.get("JSBridge");

                if (methodHashMap!=null && methodHashMap.size()!=0 && methodHashMap.containsKey(methodName)) {
                    Method method = methodHashMap.get(methodName);

                    if (method!=null) {
                        method.invoke(null, myWebView, arg, new CallBack(myWebView, cbName));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }
}
