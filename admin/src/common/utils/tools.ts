import * as path from 'path';
import * as fs from 'fs';
import * as md5 from 'md5';
import * as crypto from 'crypto';

const getFilePath = (
  moduleName: string,
  version: number,
  lastVersion?: number,
) => {
  const fileName = getFileName(moduleName, version, lastVersion);
  return path.join(global.__basedir, 'packages', moduleName, fileName);
};

const getFileName = (
  moduleName: string,
  version: number,
  lastVersion?: number,
) => {
  if (lastVersion) { // 这里生成差异补丁文件的路径
    return md5(`${moduleName}${lastVersion}->${version}`);
  }
  return md5(`${moduleName}${version}`);
};

// 该函数相当于使用 指定路径的文件内容 生成一个 HASH 值
const getFileMd5 = (filePath: string) => {
  const buffer = fs.readFileSync(filePath); // 读取指定路径的文件内容
  const fsHash = crypto.createHash('md5'); // 创建一个 MD5 哈希对象
  fsHash.update(buffer); // 使用 update 方法将文件的缓冲区数据传递给哈希对象。这个方法会处理数据并准备生成哈希值
  const fileMd5 = fsHash.digest('hex'); // 使用 digest 方法计算哈希值，并将其转换为十六进制字符串格式
  return fileMd5;
};

export { getFilePath, getFileName, getFileMd5 };
