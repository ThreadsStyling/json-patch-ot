export interface Options {
  proposedWinsOnEqualPath?: boolean;
}

export enum OpType {
  add = 'add',
  remove = 'remove',
  replace = 'replace',
  copy = 'copy',
  move = 'move',
  test = 'test',
}

export interface OperationBase {
  id?: number;
  path: string;
}

export interface OperationAdd extends OperationBase {
  op: OpType.add;
  value: any;
}

export interface OperationRemove extends OperationBase {
  op: OpType.remove;
  oldValue?: any;
}

export interface OperationReplace extends OperationBase {
  op: OpType.replace;
  value: any;
  oldValue?: any;
}

export interface OperationCopy extends OperationBase {
  op: OpType.copy;
  from: string;
}

export interface OperationMove extends OperationBase {
  op: OpType.move;
  from: string;
}

export interface OperationTest extends OperationBase {
  op: OpType.test;
  value: any;
}

export type Operation =
  | OperationAdd
  | OperationRemove
  | OperationReplace
  | OperationCopy
  | OperationMove
  | OperationTest;

const isValidIndex = function(str: string) {
  const n = parseInt(str);
  return n.toString() === str && n >= 0;
};

const replacePathIfHigher = function(path: string, repl: string, index: string): string {
  const result = path.substr(repl.length);
  let eoindex = result.indexOf('/');

  eoindex > -1 || (eoindex = result.length);

  const oldIndex = result.substr(0, eoindex);
  const rest = result.substr(eoindex);

  if (isValidIndex(oldIndex) && oldIndex > index) {
    return repl + (parseInt(oldIndex) - 1) + rest;
  } else {
    return path;
  }
};

const removeTransformer = function(acceptedOp: Operation, proposedOps: Operation[]): void {
  let propChangesLen = proposedOps.length,
    currentIndex = 0,
    proposedOp;
  // remove operation objects
  while ((proposedOp = proposedOps[currentIndex])) {
    // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
    if ((proposedOp.op === 'add' || proposedOp.op === 'test') && acceptedOp.path === proposedOp.path) {
      // do nothing ? (tomalec)
    }
    // node in question was removed
    else if (
      (proposedOp.from &&
        (proposedOp.from === acceptedOp.path || proposedOp.from.indexOf(acceptedOp.path + '/') === 0)) ||
      (acceptedOp.path === proposedOp.path || proposedOp.path.indexOf(acceptedOp.path + '/') === 0)
    ) {
      proposedOps.splice(currentIndex, 1);
      propChangesLen--;
      currentIndex--;
    }
    currentIndex++;
  }
  // shift indexes
  const lastSlash = acceptedOp.path.lastIndexOf('/');

  if (lastSlash > -1) {
    var index = acceptedOp.path.substr(lastSlash + 1);
    var arrayPath = acceptedOp.path.substr(0, lastSlash + 1);
    if (isValidIndex(index)) {
      // Bug prone guessing that, as number given in path, this is an array

      // Shifting array indeces
      propChangesLen = proposedOps.length;
      currentIndex = 0;
      while (currentIndex < propChangesLen) {
        proposedOp = proposedOps[currentIndex];
        currentIndex++;

        if (proposedOp.path.indexOf(arrayPath) === 0) {
          //item from the same array
          proposedOp.path = replacePathIfHigher(proposedOp.path, arrayPath, index);
        }
        if (proposedOp.from && proposedOp.from.indexOf(arrayPath) === 0) {
          //item from the same array
          proposedOp.from = replacePathIfHigher(proposedOp.from, arrayPath, index);
        }
      }
    }
  }
};

const replaceTransformer = function(acceptedOp: Operation, proposedOps: Operation[], options: Options) {
  const {proposedWinsOnEqualPath} = options;
  let currentIndex = 0,
    proposedOp;
  // remove operation objects withing replaced JSON node
  while ((proposedOp = proposedOps[currentIndex])) {
    // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
    // node in question was removed
    // IT:
    // if( patchOp.path === originalOp.path || originalOp.path.indexOf(patchOp.path + "/") === 0 ){
    if (
      (proposedOp.from &&
        (proposedOp.from === acceptedOp.path || proposedOp.from.indexOf(acceptedOp.path + '/') === 0)) ||
      (proposedWinsOnEqualPath && acceptedOp.path === proposedOp.path) ||
      proposedOp.path.indexOf(acceptedOp.path + '/') === 0
    ) {
      proposedOps.splice(currentIndex, 1);
      currentIndex--;
    }
    currentIndex++;
  }
};

const transformAgainst = {
  remove: removeTransformer,
  replace: replaceTransformer,
};

const reduceJSONPatches = function(proposedOps: Operation[], acceptedOp: Operation, options: Options) {
  const transformFunc = transformAgainst[acceptedOp.op];

  if (transformFunc) transformFunc(acceptedOp, proposedOps, options);

  return proposedOps;
};

/**
 * Takes array of proposed patches and transforms them against an array of already accepted patches.
 * @param acceptedOps Array of already accepted patches
 * @param proposedOps Array of proposed patches
 * @param options Options object
 *
 * @returns Array of transformed changes
 */
export default function JSONPatchOT(
  acceptedOps: Operation[],
  proposedOps: Operation[],
  options: Options = {},
): Operation[] {
  const clonedProposed = JSON.parse(JSON.stringify(proposedOps));

  return acceptedOps.reduce((proposedOps, acceptedOp) => {
    return reduceJSONPatches(proposedOps, acceptedOp, options);
  }, clonedProposed);
}
