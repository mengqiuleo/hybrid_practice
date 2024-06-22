import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, HttpStatus, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs'
import * as path from 'path'

import { PackageService } from './package.service';
import { QueryPackageDto } from './dto/query.package.dto';
import { CreatePackageDto } from './dto/create.package.dto';
import { getFileName, getFilePath } from 'src/common/utils/tools';
import { ApiException } from 'src/common/exceptions/api.exception';
import { ApiErrorCode } from 'src/common/enums/api-error-code.enum';
import { GetLatestPackageDto } from './dto/getLatest.package.dto';

const destination = (req, file, cb) => {
  const { moduleName } = req.body;
  const mainPath = 'packages';
  if (!fs.existsSync(mainPath)) {
    fs.mkdirSync(mainPath);
  }
  const workPath = `packages/${moduleName}`;
  if (!fs.existsSync(workPath)) {
    fs.mkdirSync(workPath);
  }
  cb(null, `./packages/${moduleName}`);
}
const filename = (req, file, cb) => {
  const { moduleName, version } = req.body;
  const fileName = getFileName(moduleName, version);
  cb(null, `${fileName}_temp`);
};

const zipFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);

  if (ext !== '.zip') {
    return cb(
      new ApiException(
        '只能上传 zip 类型文件',
        ApiErrorCode.FILE_TYPE_INVALID,
        HttpStatus.OK,
      ),
      false,
    );
  }

  return cb(null, true);
};

@Controller('/')
@ApiTags('离线包') // 添加分组
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get('getPackageInfoList')
  @ApiOperation({ summary:"获取离线包列表", description:"" }) // 接口描述
  async getPackageInfoList(@Query() dto: QueryPackageDto) {
    // /getPackageInfoList?page=1&size=10
    return await this.packageService.getPackageInfoList(dto)
  }

  @Post('pushPackageInfo')
  @ApiOperation({ summary: '上传离线包' })
  @ApiConsumes('multipart/form-data') // 指定此端点使用 multipart/form-data 内容类型
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination,
        filename,
      }),
      fileFilter: zipFileFilter,
    }),
  )
  async pushPackageInfo(@Body() dto: CreatePackageDto) {
    console.log('packageInfo', dto)
    const { moduleName, version, ...otherDto } = dto
    const versionNo = parseInt(version, 10) // 传入的是string类型的

    // 参数校验
    const lastVersion = await this.packageService.getLatestVersion(moduleName);
    // 如果之前缓存的版本号 大于 即将要上传的新版本号（这是错误的，新版本号要增大）
    if(lastVersion && lastVersion >= versionNo) { 
      const tempFilePath = getFilePath(moduleName, versionNo) + '_temp' // 生成文件路径，临时的

      // fs.unlinkSync(tempFilePath) 通过同步方式删除指定路径的文件，即删除临时文件。如果文件不存在，会抛出一个错误
      fs.unlinkSync(tempFilePath)
      throw new ApiException(
        '版本号不能低于或等于当前最新版本',
        ApiErrorCode.VERSION_INVALID, // 10001, 离线包版本无效
        HttpStatus.OK, // 200
      )
    }

    const uploadInfo = {
      moduleName,
      version: versionNo,
      ...otherDto
    }

    return this.packageService.pushPackageInfo(uploadInfo, lastVersion);
  }

  @Get('getPackageIndex')
  @ApiOperation({ summary: '获取最新版本离线包集合的json' })
  async getPackageIndex(@Query() query: GetLatestPackageDto) {
    const latestPackageList = await this.packageService.getLatestPackageList(query.appName);
    return latestPackageList;
  }
}

/**
 * 获取最新版本离线包集合的json
{
  "data": [
    {
      "module_name": "package",
      "version": 2,
      "status": 1, (在线1，已停用2)
      "origin_file_path": "/download/package/f6405cef1167e8f93c95c6a742214c71",
      "origin_file_md5": "8a80a6ba60ddfbc856eb613002ef8252",
      "patch_file_path": "/download/package/b9a2948eaa24fdeebd23a437df71a185",
      "patch_file_md5": "8a054839ccf8e4717fee92aafdd8a839"
    }
  ],
  "errorCode": 0
}

origin_file_path 是原始的 version2 的包（安卓端用不到，只是上传到后端存储并生成DIFF包）
 */