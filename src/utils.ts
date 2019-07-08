export function isValidIndex(str: string): boolean {
  const n = parseInt(str, 10);

  return n.toString() === str && n >= 0;
}

export function replacePathIndices(path: string, arrayPath: string, index: string, incUp = false): string {
  const result = path.substr(arrayPath.length);
  let slashIndex = result.indexOf('/');

  if (slashIndex === -1) slashIndex = result.length;

  const oldIndex = result.substr(0, slashIndex);
  const rest = result.substr(slashIndex);
  // For incUp we need to match equal to aswell since that element will be bumped foreward.
  const isOldBigger = incUp ? oldIndex >= index : oldIndex > index;
  const shouldChangeIndex = isValidIndex(oldIndex) && isOldBigger;

  if (shouldChangeIndex) {
    return `${arrayPath}${parseInt(oldIndex, 10) + (incUp ? 1 : -1)}${rest}`;
  } else {
    return path;
  }
}
