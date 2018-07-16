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

import {isValidIndex, replacePathIfHigher} from './utils';

const removeTransformer = function(acceptedOp: Operation, proposedOps: Operation[]): void {
  let propChangesLen = proposedOps.length;
  let currentIndex = 0;
  let proposedOp;

  while ((proposedOp = proposedOps[currentIndex])) {
    const matchesFromToPath =
      proposedOp.from && (proposedOp.from === acceptedOp.path || proposedOp.from.indexOf(acceptedOp.path + '/') === 0);
    const matchesPathToPath =
      acceptedOp.path === proposedOp.path || proposedOp.path.indexOf(acceptedOp.path + '/') === 0;

    if ((proposedOp.op === 'add' || proposedOp.op === 'test') && acceptedOp.path === proposedOp.path) {
      // do nothing ? (tomalec)
    } else if (matchesFromToPath || matchesPathToPath) {
      proposedOps.splice(currentIndex, 1);
      propChangesLen--;
      currentIndex--;
    }
    currentIndex++;
  }
  // shift indexes
  const lastSlash = acceptedOp.path.lastIndexOf('/');

  if (lastSlash > -1) {
    const index = acceptedOp.path.substr(lastSlash + 1);
    const arrayPath = acceptedOp.path.substr(0, lastSlash + 1);

    if (isValidIndex(index)) {
      // Assumes that number given in path means this is an array

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
  let currentIndex = 0;
  let proposedOp;

  // remove operation objects within replaced JSON node
  while ((proposedOp = proposedOps[currentIndex])) {
    const matchesFromToPath =
      proposedOp.from && (proposedOp.from === acceptedOp.path || proposedOp.from.indexOf(acceptedOp.path + '/') === 0);
    const matchesPathToPath =
      (proposedWinsOnEqualPath && acceptedOp.path === proposedOp.path) ||
      proposedOp.path.indexOf(acceptedOp.path + '/') === 0;

    if (matchesFromToPath || matchesPathToPath) {
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
