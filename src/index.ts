import {isValidIndex, replacePathIndices} from './utils';

export interface Options {
  acceptedWinsOnEqualPath?: boolean;
  redirectOnMove?: boolean;
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
  redirected?: boolean;
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

export type PathOperation = OperationAdd | OperationRemove | OperationReplace | OperationTest;
export type FromOperation = OperationMove | OperationCopy;
export type Operation = FromOperation | PathOperation;

export type PathProp = keyof Pick<PathOperation & FromOperation, 'from' | 'path'>;

function shiftIndices(acceptedOp: PathOperation, proposedOps: Operation[], isAdd?: boolean, pathProp?: 'path'): void;
function shiftIndices(acceptedOp: FromOperation, proposedOps: Operation[], isAdd?: boolean, pathProp?: PathProp): void;

function shiftIndices<T extends Operation>(
  acceptedOp: T,
  proposedOps: Operation[],
  isAdd = false,
  pathProp: keyof T = 'path',
): void {
  const path = (acceptedOp[pathProp] as unknown) as FromOperation['path'] | FromOperation['from'];

  const lastSlash: number = path.lastIndexOf('/');

  if (lastSlash === -1) return;

  const index = path.substr(lastSlash + 1);
  const arrayPath = path.substr(0, lastSlash + 1);

  if (!isValidIndex(index)) return;

  for (const proposedOp of proposedOps) {
    const pathOfSameArray = proposedOp.path.indexOf(arrayPath) === 0;

    if (!proposedOp.redirected && pathOfSameArray) {
      // Does not use `pathProp` on the proposedOp since we need to deal with
      // both path types on the proposedOp anyway. See below it deals with `from`.
      proposedOp.path = replacePathIndices(proposedOp.path, arrayPath, index, isAdd);
    }

    const hasFromOp = proposedOp.op === OpType.move || proposedOp.op === OpType.copy ? proposedOp : null;
    const fromOfSameArray = hasFromOp && hasFromOp.from && hasFromOp.from.indexOf(arrayPath) === 0;
    if (hasFromOp && fromOfSameArray) {
      hasFromOp.from = replacePathIndices(hasFromOp.from, arrayPath, index, isAdd);
    }
  }
}

const allowWhitelist = (acceptedOp: Operation, proposedOp: Operation): boolean => {
  return (proposedOp.op === 'add' || proposedOp.op === 'test') && acceptedOp.path === proposedOp.path;
};

const isFromOperation = (operation: Operation): operation is FromOperation => {
  return operation.op === OpType.move || operation.op === OpType.copy;
};

function removeOperations(
  acceptedOp: PathOperation,
  proposedOps: Operation[],
  options: Options,
  skipWhitelist?: boolean,
  pathProp?: 'path',
): void;
function removeOperations(
  acceptedOp: FromOperation,
  proposedOps: Operation[],
  options: Options,
  skipWhitelist?: boolean,
  pathProp?: PathProp,
): void;

function removeOperations<T extends Operation>(
  acceptedOp: T,
  proposedOps: Operation[],
  options: Options,
  skipWhitelist = false,
  pathProp: keyof T = 'path',
): void {
  const {acceptedWinsOnEqualPath} = options;
  let currentIndex = 0;
  let proposedOp: Operation;

  // remove operation objects within replaced JSON node
  while (proposedOps[currentIndex]) {
    proposedOp = proposedOps[currentIndex];
    let matchesFromToPath = false;
    const acceptedPath = (acceptedOp[pathProp] as unknown) as FromOperation['path'] | FromOperation['from'];

    if (isFromOperation(proposedOp)) {
      matchesFromToPath = proposedOp.from === acceptedPath || proposedOp.from.indexOf(acceptedPath + '/') === 0;
    }

    const matchesPathToPath =
      (acceptedWinsOnEqualPath && acceptedPath === proposedOp.path) ||
      proposedOp.path.indexOf(`${acceptedPath}/`) === 0;

    const shouldSkip = proposedOp.redirected || (skipWhitelist ? allowWhitelist(acceptedOp, proposedOp) : false);

    if (!shouldSkip && (matchesFromToPath || matchesPathToPath)) {
      proposedOps.splice(currentIndex, 1);
      currentIndex--;
    }

    currentIndex++;
  }
}

function redirectPaths(acceptedOp: OperationMove, proposedOps: Operation[]): void {
  const acceptedFrom = acceptedOp.from;
  const acceptedPath = acceptedOp.path;

  for (const proposedOp of proposedOps) {
    const matchesPathToFrom = proposedOp.path === acceptedFrom || proposedOp.path.indexOf(acceptedFrom + '/') === 0;

    let matchesFromToFrom = false;
    if (isFromOperation(proposedOp)) {
      matchesFromToFrom = proposedOp.from === acceptedFrom || proposedOp.from.indexOf(acceptedFrom + '/') === 0;
    }

    const isProposedOpFrom = isFromOperation(proposedOp);

    if (!isProposedOpFrom && matchesPathToFrom) {
      proposedOp.path = acceptedPath + proposedOp.path.substr(acceptedFrom.length);
      proposedOp.redirected = true;
    } else if (isProposedOpFrom) {
      const proposedFromOp = proposedOp as FromOperation;
      if (matchesFromToFrom) {
        proposedFromOp.from = acceptedPath + proposedFromOp.from.substr(acceptedFrom.length);
        proposedFromOp.redirected = true;
      } else if (matchesPathToFrom) {
        proposedOp.path = acceptedPath + proposedOp.path.substr(acceptedFrom.length);
        proposedFromOp.redirected = true;
      }
    }
  }
}

function removeRedirectedFlag(proposedOps: Operation[]): void {
  proposedOps.forEach((op) => {
    delete op.redirected;
  });
}

const removeTransformer = (acceptedOp: OperationRemove, proposedOps: Operation[]): void => {
  removeOperations(acceptedOp, proposedOps, {acceptedWinsOnEqualPath: true}, true);
  shiftIndices(acceptedOp, proposedOps);
};

const replaceTransformer = (acceptedOp: OperationReplace, proposedOps: Operation[], options: Options): void => {
  removeOperations(acceptedOp, proposedOps, options);
};

const addTransformer = (acceptedOp: OperationAdd, proposedOps: Operation[], options: Options): void => {
  shiftIndices(acceptedOp, proposedOps, true);
  removeOperations(acceptedOp, proposedOps, options);
};

const copyTransformer = (acceptedOp: OperationCopy, proposedOps: Operation[], options: Options): void => {
  shiftIndices(acceptedOp, proposedOps, true);
  removeOperations(acceptedOp, proposedOps, options);
};

const moveTransformer = (acceptedOp: OperationMove, proposedOps: Operation[], options: Options): void => {
  if (options.redirectOnMove) {
    redirectPaths(acceptedOp, proposedOps);
  }
  removeOperations(acceptedOp, proposedOps, {acceptedWinsOnEqualPath: true}, true, 'from'); // like a remove
  shiftIndices(acceptedOp, proposedOps, false, 'from'); // like a remove
  shiftIndices(acceptedOp, proposedOps, true, 'path'); // like an add
  removeOperations(acceptedOp, proposedOps, options, false, 'path'); // like an add
  if (options.redirectOnMove) {
    removeRedirectedFlag(proposedOps);
  }
};

const transformAgainst = {
  [OpType.remove]: removeTransformer,
  [OpType.replace]: replaceTransformer,
  [OpType.add]: addTransformer,
  [OpType.copy]: copyTransformer,
  [OpType.move]: moveTransformer,
  [OpType.test]: undefined,
};

const reduceJSONPatches = (options: Options) => (proposedOps: Operation[], acceptedOp: Operation): Operation[] => {
  const transformFunc = transformAgainst[acceptedOp.op];

  if (transformFunc) transformFunc(acceptedOp as any, proposedOps, options);

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

  return acceptedOps.reduce(reduceJSONPatches(options), clonedProposed);
}
