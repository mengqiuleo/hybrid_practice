package com.example.webpackagekit.webpackagekit;

import com.example.webpackagekit.webpackagekit.core.PackageInfo;

/**
 * 校验资源信息的有效性
 */
public interface PackageValidator {
    boolean validate(PackageInfo info);
}
