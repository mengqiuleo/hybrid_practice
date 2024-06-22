export const getFileType = (str: string) => {
  str = str.replace(/\?.*/, '');
  const split = str.split('.');
  let ext = split.pop();
  // if (options.transformExtensions.test(ext)) {
  //   ext = split.pop() + '.' + ext;
  // }
  return ext;
}