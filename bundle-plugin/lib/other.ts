// import { Plugin } from 'vite';
// import { createFilter } from '@rollup/pluginutils';
import JSZip from 'jszip';
import mime from 'mime-types';
import { extname } from 'path';

import type { Plugin, NormalizedOutputOptions, OutputBundle, OutputChunk, OutputAsset, EmittedAsset } from 'rollup';

export interface RollupHtmlTemplateOptions {
  title: string;
  attributes: Record<string, any>;
  publicPath: string;
  meta: Record<string, any>[];
  bundle: OutputBundle;
  files: Record<string, (OutputChunk | OutputAsset)[]>;
}


const getFiles = (bundle: OutputBundle): RollupHtmlTemplateOptions['files'] => {
  const result = {} as ReturnType<typeof getFiles>;
  for (const file of Object.values(bundle)) {
    const { fileName } = file;
    const extension = extname(fileName).substring(1);

    result[extension] = (result[extension] || []).concat(file);
  }

  return result;
};

export function OfflinePackagePlugin(options) {
  const defaultOptions = {
    packageNameKey: 'packageName',
    packageNameValue: '',
    version: 1,
    folderName: 'package',
    indexFileName: 'index.json',
    baseUrl: '',
    fileTypes: [],
    excludeFileName: [],
    transformExtensions: /^(gz|map)$/i,
    serialize: (manifest) => JSON.stringify(manifest, null, 2),
  };

  options = { ...defaultOptions, ...options };

  function getFileType(str) {
    str = str.replace(/\?.*/, '');
    const split = str.split('.');
    let ext = split.pop();
    if (options.transformExtensions.test(ext)) {
      ext = split.pop() + '.' + ext;
    }
    return ext;
  }

  return {
    name: 'vite-offline-package-plugin',
    async generateBundle(output: NormalizedOutputOptions, bundle: OutputBundle) {
      // 1. 获取打包后的文件
      const files = getFiles(bundle);

      console.log('files', files)




      // const zip = new JSZip();
      // const folder = zip.folder(options.folderName);

      // const content = {
      //   [options.packageNameKey]: options.packageNameValue,
      //   version: options.version,
      //   items: [],
      // };

      // const isFileTypeLimit = options.fileTypes.length > 0;

      // for (const fileName in bundle) {
      //   const fileType = getFileType(fileName);
      //   const file = bundle[fileName];

      //   if (options.excludeFileName.includes(fileName)) continue;
      //   if (isFileTypeLimit && !options.fileTypes.includes(fileType)) continue;

      //   content.items.push({
      //     [options.packageNameKey]: options.packageNameValue,
      //     version: options.version,
      //     remoteUrl: options.baseUrl + fileName,
      //     path: fileName,
      //     mimeType: mime.lookup(fileType),
      //   });

      //   folder.file(fileName, file.source);
      // }

      // const outputFile = options.serialize(content);
      // folder.file(options.indexFileName, outputFile);

      // const zipContent = await zip.generateAsync({
      //   type: 'nodebuffer',
      //   streamFiles: true,
      //   compression: 'DEFLATE',
      //   compressionOptions: { level: 9 },
      // });

      // this.emitFile({
      //   type: 'asset',
      //   fileName: `${options.folderName}.zip`,
      //   source: zipContent,
      // });
    },
  };
}
