import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, createQueryBuilder } from 'typeorm';
import * as bsdiff from 'bsdiff-node';
import * as fs from 'fs';

import { QueryPackageDto } from './dto/query.package.dto';
import { PackageEntity } from './entities/package.entity';
import { IUploadInfo } from './types';
import { getFileMd5, getFileName, getFilePath } from 'src/common/utils/tools';
import config from 'src/common/config';

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(PackageEntity)
    private readonly packageEntity: Repository<PackageEntity>,
  ) {}
  
  async getPackageInfoList(query: QueryPackageDto) {
    let whereCondition = '1=1';

    if (query.moduleName !== undefined) {
      whereCondition += ' And package.moduleName=:moduleName';
    }

    if (query.status !== undefined) {
      whereCondition += ' And package.status=:status';
    }

    if (query.appName !== undefined) {
      whereCondition += ' And package.appName=:appName';
    }

    const subQuery = this.packageEntity.createQueryBuilder('package');
    return subQuery
      .where(whereCondition, {
        moduleName: query.moduleName,
        status: query.status,
        appName: query.appName,
      })
      .skip((query.page - 1) * query.size)
      .take(query.size)
      .getManyAndCount()
      .then(([list, count]) => {
        return {
          list,
          total: count * 1,
        };
      });
  }

  async getLatestVersion(moduleName: string) {
    return this.packageEntity.createQueryBuilder('package')
      .where('package.moduleName=:moduleName', { moduleName })
      .orderBy('package.version', 'DESC')
      .getOne()
      .then(item => {
        if(item) {
          return item.version
        } else {
          return null
        }
      })
      .catch(error => Logger.log('service: getLatestVersion', error))
  }
  async pushPackageInfo(uploadInfo: IUploadInfo, lastVersion: number | void) {
    try {
      const { moduleName, version } = uploadInfo

      // 因校验通过，因此需去除本地文件名的 _tmp 后缀
      const tempFilePath = getFilePath(moduleName, version) + '_temp';
      console.log(tempFilePath) //E:\android_study\temp\admin\packages\packager\c165a6a4ad4dd9e898c922ecf0003e3b_temp
      const filePath = getFilePath(moduleName, version);
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, filePath);
      }
      

      const fileMd5 = getFileMd5(filePath); // 生成即将要上传的文件的 hash 值
      let patchUrls = '';

      // 如果存在上个版本，则使用 bsdiff 算法计算两个版本的差分包
      if(lastVersion) {
        const oldFilePath = getFilePath(moduleName, lastVersion);

        const patchFileName = getFileName(moduleName, version, lastVersion);
        // 差异补丁文件的路径
        const patchFilePath = getFilePath(moduleName, version, lastVersion);

        await bsdiff.diff(
          oldFilePath,
          filePath,
          patchFilePath,
          // function (result) 表示生成补丁的进度或结果，将其转换为字符串并打印出来
          (result: any, err: any) => {
            if (err) {
              Logger.error('生成补丁包', err);
              return;
            }
            Logger.log('diff:' + String(result).padStart(4) + '%');
          },
        )

        const patchFileMd5 = getFileMd5(patchFilePath);

        patchUrls = JSON.stringify({
          [lastVersion]: {
            fileUrl: `${config.downloadUrl}/${moduleName}/${patchFileName}`,
            fileMd5: patchFileMd5,
          },
        })
      }

      const fileName = getFileName(moduleName, version)
      const packageInfo = {
        status: 1,
        fileUrl: `${config.downloadUrl}/${moduleName}/${fileName}`,
        fileMd5,
        patchUrls,
        ...uploadInfo,
      }

      console.log('packageInfo', packageInfo)
      return this.packageEntity.save(this.packageEntity.create(packageInfo))

    } catch(error) {
      Logger.log('service: pushPackageInfo', error);
    }
  }

  async getLatestPackageList(appName: string | undefined) {
    const items = await this.packageEntity
      .createQueryBuilder('package')
      .where('package.appName=:appName', { appName })
      .groupBy('moduleName')
      .select('moduleName')
      .addSelect('MAX(version)', 'version')
      .getRawMany()

    return await Promise.all(
      items.map(async item => {
        const latestItem = await this.packageEntity
          .createQueryBuilder('package')
          .where(
            'package.moduleName=:moduleName And package.version=:version',
            {
              moduleName: item.moduleName,
              version: item.version,
            },
          )
          .getOne();

        let { patchUrls } = latestItem;
        patchUrls = patchUrls ? JSON.parse(patchUrls) : '';
        const preVersion = patchUrls ? Object.keys(patchUrls)[0] : '';
        const patchFileUrl = patchUrls ? patchUrls[preVersion].fileUrl : '';
        const patchFileMd5 = patchUrls ? patchUrls[preVersion].fileMd5 : '';

        return {
          module_name: latestItem.moduleName,
          version: latestItem.version,
          status: latestItem.status,
          origin_file_path: latestItem.fileUrl,
          origin_file_md5: latestItem.fileMd5,
          patch_file_path: patchFileUrl,
          patch_file_md5: patchFileMd5,
        };
      })
    )
  }
}
