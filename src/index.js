/**
 * @callback Function
 * @param {unknown} x
 * @returns {unknown}
 *
 * @callback AsyncFunction
 * @param {unknown}
 * @returns {Async}
 *
 * @callback Handler
 * @param {unknown} x
 * @returns {unknown}
 *
 * @callback Fork
 * @param {Handler} rejected
 * @param {Handler} resolved
 * @returns {unknown}
 *
 * @callback Map
 * @param {Function}
 * @returns {Async}
 *
 * @callback Chain
 * @param {AsyncFunction}
 * @returns {Async}
 *
 * @callback Async
 * @param {Fork} fork
 * @returns {{fork: Fork, toPromise: Promise<unknown>, map: Map, chain: Chain, fold: Fold}}
 */
const Async = (fork) => ({
  fork,
  toPromise: () => new Promise((resolve, reject) => fork(reject, resolve)),
  map: (fn) => Async((rej, res) => fork(rej, (x) => res(fn(x)))),
  // bimap: (f, g) =>
  //   Async((rej, res) =>
  //     fork(
  //       (x) => rej(f(x)),
  //       (x) => res(g(x))
  //     )
  //   ),
  chain: (fn) => Async((rej, res) => fork(rej, (x) => fn(x).fork(rej, res))),
  // bichain: (f, g) =>
  //   Async((rej, res) =>
  //     fork(
  //       (x) => f(x).fork(rej, res),
  //       (x) => g(x).fork(rej, res)
  //     )
  //   ),
  fold: (f, g) =>
    Async((rej, res) =>
      fork(
        (x) => f(x).fork(rej, res),
        (x) => g(x).fork(rej, res)
      )
    ),
});

export const of = (x) => Async((rej, res) => res(x));
export const Resolved = (x) => Async((rej, res) => res(x));
export const Rejected = (x) => Async((rej, res) => rej(x));
export const fromPromise =
  (f) =>
  (...args) =>
    Async((rej, res) =>
      f(...args)
        .then(res)
        .catch(rej)
    );

export default {
  of,
  fromPromise,
  Resolved,
  Rejected,
};
