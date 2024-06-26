import path from "path"
import JSZip from 'jszip'
import fs from 'fs'
import mime from 'mime-types'
import { getFileType } from "./util"

export const OfflinePackagePlugin = function (options) {
  const defaultOptions = {
    // packageNameKey: 'packageId',
    // packageNameValue: 'meeting',
    // index.json:   "packageId": "meeting"
    packageNameKey: 'packageName',
    packageNameValue: 'main',
    version: 1,
    folderName: 'main', // 打包后的 zip 名称
    indexFileName: 'index.json', // 版本的 json文件名称
    baseUrl: '',
    fileTypes: [], // ['html', 'js', 'css', 'png']
    excludeFileName: [],
    transformExtensions: /^(gz|map)$/i,
    serialize: (manifest) => JSON.stringify(manifest, null, 2), // 生成格式化的 JSON 字符串，缩进为2字符
  }

  options = { ...defaultOptions, ...options }

  const output = path.resolve(__dirname, '../dist') // 需要压缩成ZIP的文件夹
	const fileName = `${options.folderName}.zip` // 打包后的

  // create index.json
  const content = {
    [options.packageNameKey]: options.packageNameValue,
    version: options.version,
    items: []
  };

	const makeZip = function () {
		const zip = new JSZip()
		const distPath = path.resolve(output)
		// 因为我想压缩包中的dist文件夹层级保留 且重新命名为product2_web 所以这里设置了allFolder  ,如果不要该层级 则直接用zip即可
		// let allFolder = zip.folder('product2_web')
    let allFolder = zip.folder(options.folderName)
		const readDir = function (allFolder, dirPath) {
			// 读取dist下的根文件目录
			const files = fs.readdirSync(dirPath)
			files.forEach((fileName) => {
				const fillPath = path.join(dirPath, './', fileName)
				const file = fs.statSync(fillPath)
				// 如果是文件夹的话需要递归遍历下面的子文件
				if (file.isDirectory()) {
					const dirZip = allFolder.folder(fileName)
					readDir(dirZip, fillPath)
				} else {
          console.log('读取到每个文件', fileName) // index-DiwrgTda.css, index-DVoHNO1Y.js

          // 遍历到每个文件，信息放入 index.json 中
          content.items.push({
            [options.packageNameKey]: options.packageNameValue,
            version: options.version,
            remoteUrl: options.baseUrl + fileName,
            path: fileName,
            mimeType: mime.lookup(getFileType(fileName))
          });

          // 读取每个文件为buffer存到zip中
					allFolder.file(fileName, fs.readFileSync(fillPath))
				}
			})
		}


		const removeExistedZip = () => {
			const dest = path.join(distPath, './' + fileName)
			if (fs.existsSync(dest)) {
				fs.unlinkSync(dest)
			}
		}

		const zipDir = function () {
			readDir(allFolder, distPath)
      // 生成 index.json
      const outputFile = options.serialize(content)

      allFolder.file(options.indexFileName, outputFile)
      fs.writeFileSync(path.join(distPath, 'index.json'), outputFile)

			zip.generateAsync({
				type: 'nodebuffer', // 压缩类型
				compression: 'DEFLATE', // 压缩算法
				compressionOptions: {
					// 压缩级别
					level: 9
				}
			}).then((content) => {
				const dest = path.join(distPath, fileName)
				removeExistedZip()
				// 把zip包写到硬盘中，这个content现在是一段buffer
				fs.writeFileSync(dest, content)
			})
		}
		removeExistedZip()
		zipDir()
	}
	return {
		name: 'vite-plugin-auto-zip',
		// apply: 'build',
		closeBundle() {
			makeZip()
		}
	}
}
