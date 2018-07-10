interface IOptions {
  oldestWins?: boolean,
}

export default function createTransformer(options?: IOptions): Function {
  return function() { return Object.keys(options || {}) };
}
