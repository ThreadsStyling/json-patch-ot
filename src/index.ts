export interface Options {
  acceptedWinsOnEqualPath?: boolean;
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

import {isValidIndex, replacePathIndices} from './utils';

const shiftIndices = (acceptedOp: Operation, proposedOps: Operation[], isAdd = false, pathProp = 'path'): void => {
  const lastSlash = acceptedOp[pathProp].lastIndexOf('/');

  if (lastSlash === -1) return;

  const index = acceptedOp[pathProp].substr(lastSlash + 1);
  const arrayPath = acceptedOp[pathProp].substr(0, lastSlash + 1);

  if (!isValidIndex(index)) return;

  for (const proposedOp of proposedOps) {
    const pathOfSameArray = proposedOp.path.indexOf(arrayPath) === 0;

    if (pathOfSameArray) {
      proposedOp.path = replacePathIndices(proposedOp.path, arrayPath, index, isAdd);
    }

    const hasFromOp = proposedOp.op === OpType.move || proposedOp.op === OpType.copy ? proposedOp : null;
    const fromOfSameArray = hasFromOp && hasFromOp.from && hasFromOp.from.indexOf(arrayPath) === 0;

    if (hasFromOp && fromOfSameArray) {
      hasFromOp.from = replacePathIndices(hasFromOp.from, arrayPath, index, isAdd);
    }
  }
};

const allowWhitelist = (acceptedOp: Operation, proposedOp: Operation): boolean => {
  return (proposedOp.op === 'add' || proposedOp.op === 'test') && acceptedOp.path === proposedOp.path;
};

const removeOperations = (
  acceptedOp: Operation,
  proposedOps: Operation[],
  options: Options,
  skipWhitelist = false,
  pathProp = 'path',
): void => {
  const {acceptedWinsOnEqualPath} = options;
  let currentIndex = 0;
  let proposedOp;

  // remove operation objects within replaced JSON node
  while (proposedOps[currentIndex]) {
    proposedOp = proposedOps[currentIndex];
    const matchesFromToPath =
      proposedOp.from &&
      (proposedOp.from === acceptedOp[pathProp] || proposedOp.from.indexOf(acceptedOp[pathProp] + '/') === 0);
    const matchesPathToPath =
      (acceptedWinsOnEqualPath && acceptedOp[pathProp] === proposedOp.path) ||
      proposedOp.path.indexOf(acceptedOp[pathProp] + '/') === 0;
    const shouldSkip = skipWhitelist ? allowWhitelist(acceptedOp, proposedOp) : false;

    if (!shouldSkip && (matchesFromToPath || matchesPathToPath)) {
      proposedOps.splice(currentIndex, 1);
      currentIndex--;
    }

    currentIndex++;
  }
};

const removeTransformer = (acceptedOp: Operation, proposedOps: Operation[]): void => {
  removeOperations(acceptedOp, proposedOps, {acceptedWinsOnEqualPath: true}, true);
  shiftIndices(acceptedOp, proposedOps);
};

const replaceTransformer = (acceptedOp: Operation, proposedOps: Operation[], options: Options): void => {
  removeOperations(acceptedOp, proposedOps, options);
};

const addTransformer = (acceptedOp: Operation, proposedOps: Operation[], options: Options): void => {
  removeOperations(acceptedOp, proposedOps, options);
  shiftIndices(acceptedOp, proposedOps, true);
};

const moveTransformer = (acceptedOp: Operation, proposedOps: Operation[], options: Options): void => {
  removeOperations(acceptedOp, proposedOps, {acceptedWinsOnEqualPath: true}, true, 'from'); // like a remove
  removeOperations(acceptedOp, proposedOps, options, false, 'path'); // like an add
  shiftIndices(acceptedOp, proposedOps, true, 'path'); // like an add
  shiftIndices(acceptedOp, proposedOps, false, 'from'); // like a remove
};

const transformAgainst = {
  remove: removeTransformer,
  replace: replaceTransformer,
  add: addTransformer,
  copy: addTransformer,
  move: moveTransformer,
};

const reduceJSONPatches = (proposedOps: Operation[], acceptedOp: Operation, options: Options): Operation[] => {
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
