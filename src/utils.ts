export function isValidIndex(str: string): boolean {
  const n = parseInt(str);
  return n.toString() === str && n >= 0;
};

export function replacePathIfHigher(path: string, arrayPath: string, index: string): string {
  const result = path.substr(arrayPath.length);
  let eoindex = result.indexOf('/');

  if (eoindex <= -1) eoindex = result.length;

  const oldIndex = result.substr(0, eoindex);
  const rest = result.substr(eoindex);

  if (isValidIndex(oldIndex) && oldIndex > index) {
    return arrayPath + (parseInt(oldIndex) - 1) + rest;
  } else {
    return path;
  }
};
