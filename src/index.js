/**
 * @callback Function
 * @param {unknown} x
 * @returns {unknown}
 *
 * @callback AsyncFunction
 * @param {unknown} fn
 * @returns {Async}
 *
 * @callback BiFunction
 * @param {Function} x
 * @param {Function} y
 * @returns {Async}
 *
 * @callback Handler
 * @param {unknown} fn
 * @returns {unknown}
 *
 * @callback Fork
 * @param {Handler} rejected
 * @param {Handler} resolved
 * @returns {unknown}
 *
 * @callback Map
 * @param {Function} fn
 * @returns {Async}
 *
 * @callback Chain
 * @param {AsyncFunction} fn
 * @returns {Async}
 *
 * @callback BiChainFn
 * @param {AsyncFunction} fn
 * @returns {Async}
 *
 * @callback Fold
 * @param {Function} rej
 * @param {Function} res
 * @returns {Async}
 *
 * @callback Async
 * @param {Fork} fork
 * @returns {{fork: Fork, toPromise: Promise<unknown>, map: Map, bimap: BiFunction, chain: Chain, bichain: BiChainFn, fold: Fold}}
 */

const BRAND = Symbol.for("hyper-async/Async");
const typeOf = (v) =>
  v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
const isAsync = (x) =>
  !!(x && x[BRAND] === true && typeof x.fork === "function");

const Async = (fork) => ({
  [BRAND]: true,
  fork,
  toPromise: () =>
    new Promise((resolve, reject) => {
      let settled = false;
      const ok = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      const err = (e) => {
        if (settled) return;
        settled = true;
        reject(e);
      };
      try {
        fork(err, ok);
      } catch (e) {
        err(e);
      }
    }),
  map: (fn) => {
    if (typeof fn !== "function")
      return Rejected(
        new TypeError(`Async.map expected function, got ${typeOf(fn)}`)
      );
    return Async((rej, res) =>
      fork(rej, (x) => {
        try {
          res(fn(x));
        } catch (e) {
          rej(e);
        }
      })
    );
  },
  bimap: (f, g) => {
    if (typeof f !== "function" || typeof g !== "function")
      return Rejected(
        new TypeError(
          `Async.bimap expected functions, got ${typeOf(f)} and ${typeOf(g)}`
        )
      );
    return Async((rej, res) =>
      fork(
        (x) => {
          try {
            rej(f(x));
          } catch (e) {
            rej(e);
          }
        },
        (x) => {
          try {
            res(g(x));
          } catch (e) {
            rej(e);
          }
        }
      )
    );
  },
  chain: (fn) => {
    if (typeof fn !== "function")
      return Rejected(
        new TypeError(`Async.chain expected function, got ${typeOf(fn)}`)
      );
    return Async((rej, res) =>
      fork(rej, (x) => {
        try {
          const y = fn(x);
          if (!isAsync(y)) {
            rej(
              new TypeError(
                `Async.chain expected function returning Async, got ${typeOf(
                  y
                )}`
              )
            );
            return;
          }
          y.fork(rej, res);
        } catch (e) {
          rej(e);
        }
      })
    );
  },
  bichain: (f, g) => {
    if (typeof f !== "function" || typeof g !== "function")
      return Rejected(
        new TypeError(
          `Async.bichain expected functions, got ${typeOf(f)} and ${typeOf(g)}`
        )
      );
    return Async((rej, res) =>
      fork(
        (x) => {
          try {
            const y = f(x);
            if (!isAsync(y)) {
              rej(
                new TypeError(
                  `Async.bichain expected rejected function returning Async, got ${typeOf(
                    y
                  )}`
                )
              );
              return;
            }
            y.fork(rej, res);
          } catch (e) {
            rej(e);
          }
        },
        (x) => {
          try {
            const y = g(x);
            if (!isAsync(y)) {
              rej(
                new TypeError(
                  `Async.bichain expected resolved function returning Async, got ${typeOf(
                    y
                  )}`
                )
              );
              return;
            }
            y.fork(rej, res);
          } catch (e) {
            rej(e);
          }
        }
      )
    );
  },
  fold: (f, g) => {
    if (typeof f !== "function" || typeof g !== "function")
      return Rejected(
        new TypeError(
          `Async.fold expected functions, got ${typeOf(f)} and ${typeOf(g)}`
        )
      );
    return Async((rej, res) =>
      fork(
        (x) => {
          try {
            const y = f(x);
            if (!isAsync(y)) {
              rej(
                new TypeError(
                  `Async.fold expected rejected function returning Async, got ${typeOf(
                    y
                  )}`
                )
              );
              return;
            }
            y.fork(rej, res);
          } catch (e) {
            rej(e);
          }
        },
        (x) => {
          try {
            const y = g(x);
            if (!isAsync(y)) {
              rej(
                new TypeError(
                  `Async.fold expected resolved function returning Async, got ${typeOf(
                    y
                  )}`
                )
              );
              return;
            }
            y.fork(rej, res);
          } catch (e) {
            rej(e);
          }
        }
      )
    );
  },
});

export const of = (x) => Async((rej, res) => res(x));
export const Resolved = (x) => Async((rej, res) => res(x));
export const Rejected = (x) => Async((rej, res) => rej(x));
export const fromPromise = (f) => {
  if (typeof f !== "function") {
    return () =>
      Rejected(
        new TypeError(`Async.fromPromise expected function, got ${typeOf(f)}`)
      );
  }
  return (...args) =>
    Async((rej, res) => {
      let out;
      try {
        out = f(...args);
      } catch (e) {
        rej(e);
        return;
      }
      if (out && typeof out.then === "function") {
        out.then(res, rej);
      } else {
        res(out);
      }
    });
};

export default {
  of,
  fromPromise,
  Resolved,
  Rejected,
};
