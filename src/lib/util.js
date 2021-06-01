import mkdirpSync from 'mkdirp';
import fs from 'fs-extra';
import path from 'path';

export const promiseCall = (fn, ...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

export const writeFileR = async (...args) => {
  const fileName = args[0];
  mkdirpSync(path.dirname(fileName))
  return fs.writeFile(...args);
};

export const sendToPast = (fileName, bypass) => {
  if (bypass) return Promise.resolve();
  return fs.utimes(
    fileName,
    new Date(Date.now() - 10000),
    new Date(Date.now() - 10000)
  );
};
