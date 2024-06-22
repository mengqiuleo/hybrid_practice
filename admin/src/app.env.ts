import * as dotenv from 'dotenv';
import { join } from 'path';

// 加载对应环境下的配置文件
// path模块是node.js内置的功能，但是node.js本身并不支持typescript，所以直接在typescript项目里使用是不行的. 解决方法：安装@types/node
dotenv.config({ path: join(__dirname, `../.env.${process.env.NODE_ENV}`) });

export const isProd = process.env.NODE_ENV === 'production';

export const isDev = process.env.NODE_ENV === 'development';

export const config = {
  // mysql
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE,
  MYSQL_USERNAME: process.env.MYSQL_USERNAME,
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
};
