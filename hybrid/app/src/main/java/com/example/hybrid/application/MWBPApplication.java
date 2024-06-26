package com.example.hybrid.application;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.example.webpackagekit.webpackagekit.PackageManager;
import com.example.webpackagekit.webpackagekit.core.Constants;

import org.greenrobot.eventbus.EventBus;
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class MWBPApplication extends Application {

    private static Context context;

    @Override
    public void onCreate() {
        super.onCreate();
        context = getApplicationContext();
        EventBus.getDefault().register(this);

        // Clear cache for testing（开发时用，生产环境不用）
        // 清除缓存，否则本地已经存在 packageIndex.json 文件，那么首次加载本地离线包会不成功（相关代码在 PackageManager - performLoadAssets 函数）
        PackageManager.getInstance().clearCache(context);

        PackageManager.getInstance().init(context);
        getPackageIndex(Constants.BASE_PACKAGE_INDEX);
    }

    // 该函数 获取 package index（包索引），然后通过 EventBus 发布获取到的数据
    private void getPackageIndex(final String url){
        new Thread(new Runnable() {
            @Override
            public void run() {
                // 客户端启动时会请求最新的 packageIndex 文件
            // 初始化测试 http://127.0.0.1:3000/getPackageIndex?appName=main
                Log.d("getPackageIndex", "初始化测试" + url);
                try {
                    OkHttpClient client = new OkHttpClient();
                    Request request = new Request.Builder().url(url).build();
                    try (Response response = client.newCall(request).execute()) {
                        String data =  response.body().string();
                        Log.d("getPackageIndex", "getPackageIndex 结果" + data);
                        Log.d("getPackageIndex", "do post");
                        // getPackageIndex 方法通过 EventBus.getDefault().post(data) 发布了一个事件，事件的数据是从服务器获取的包索引字符串 data
                        // 当事件发布后，所有订阅了该事件的订阅者方法都会被调用
                        EventBus.getDefault().post(data);
                    }
                } catch (IOException e) {
                    Log.w("getPackageIndex", "请求最新的 packageIndex 文件 出错");
                    e.printStackTrace();
                }
            }
        }).start();
    }

    // Subscribe 订阅！！！
    @Subscribe(threadMode = ThreadMode.MAIN)
    public void updatePackageManager(String res){
        Log.d("getPackageIndex", "updatePackageManager(更新离线资源包)");
        PackageManager.getInstance().update(res);
    }

    public static Context getGlobalContext() {
        return context;
    }
}
