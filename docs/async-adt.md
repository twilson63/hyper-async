# Async (Task) ADT: A Practical Guide

This guide explains the Async (aka Task) Algebraic Data Type in hyper-async and how to compose it with `map`, `chain`, `bimap`, and `bichain`.

## What is Async?

Async models an asynchronous computation as a value. It wraps an effectful process and exposes combinators to transform and compose it without running the effect immediately. You run it by turning it into a Promise (`toPromise`) or by forking it (`fork`).

Key properties:

- Lazy: constructing/composing does not run the effect.
- Composable: small steps combine into larger programs.
- In-band errors: failures are values (`Rejected`), not thrown exceptions.

## Creating Async values

- `Resolved(x)` / `of(x)`: create a successful Async.
- `Rejected(e)`: create a failed Async.
- `fromPromise(f)(...args)`: lift a function returning a Promise (or value) into Async.

## Running Async

- `toPromise()`: run the computation and get a Promise.
- `fork(rejected, resolved)`: run with explicit handlers.

## map(fn)

Transforms the resolved value while leaving the error channel untouched.

- Input: `fn: (a) -> b`
- Output: `Async<b>`
- Errors: if `fn` throws, the result becomes a rejected Async.

Example:

```js
Async.of(2)
  .map((x) => x * 2) // Async.of(4)
  .toPromise();
```

## chain(fn)

Flat-maps the resolved value by sequencing another Async.

- Input: `fn: (a) -> Async<b>`
- Output: `Async<b>`
- Errors: if `fn` throws or does not return an Async, the result is rejected.

Example:

```js
const get = (id) => Async.fromPromise(fetch)(`/posts/${id}`);
Async.of(1)
  .chain(get) // Async<Response>
  .toPromise();
```

## bimap(leftFn, rightFn)

Maps both channels: transform the error with `leftFn` or the success with `rightFn`.

- Inputs: `leftFn: (e) -> e2`, `rightFn: (a) -> b`
- Output: `Async<b>` (or rejected with transformed error)
- Errors: if either function throws, the result is rejected.

Example:

```js
Async.Rejected("bad")
  .bimap(
    (e) => ({ reason: e }),
    (x) => x
  )
  .toPromise(); // rejects with { reason: "bad" }
```

## bichain(leftFn, rightFn)

Flat-map on both channels: recover or continue with an Async from either side.

- Inputs: `leftFn: (e) -> Async<b>`, `rightFn: (a) -> Async<b>`
- Output: `Async<b>`
- Errors: if either function throws or returns non-Async, the result is rejected.

Example:

```js
const recover = (e) => Async.Resolved(0);
const compute = (x) => Async.Resolved(x + 1);

Async.Rejected("bad")
  .bichain(recover, compute) // Async.Resolved(0)
  .toPromise();
```

## Error Semantics

- All user callbacks are wrapped with try/catch; sync throws become rejected Asyncs.
- `chain/bichain` require callbacks to return Async; non-Async returns reject with a helpful TypeError.
- `fromPromise` catches sync throws; promises that reject propagate as rejected Asyncs.

## Tips

- Isolate effects using `fromPromise`; keep `map/chain` callbacks pure.
- Prefer `bichain` to handle and recover from errors functionally.
- Use `bimap` to normalize error shapes early.

## See also

- Source: `src/index.js`
- Tests: `src/index.test.js`
- README for quickstart and semantics
