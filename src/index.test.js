import { test } from "uvu";
import * as assert from "uvu/assert";

import Async, { of, fromPromise } from "./index.js";

const prop = (k) => (o) => o[k];

// Deterministic fetch mock to avoid network I/O
const RESPONSE = {
  title:
    "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
};
const fakeFetch = () =>
  Promise.resolve({
    json: () => Promise.resolve(RESPONSE),
  });

const get = (url) => fromPromise(fakeFetch)(url);
const toJSON = (res) => fromPromise(res.json.bind(res))();

test("ok", async () => {
  const x = await of(1)
    .chain((x) => get("https://jsonplaceholder.typicode.com/posts/" + x))
    .chain(toJSON)
    .map(prop("title"))
    .toPromise();
  assert.equal(
    x,
    "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
  );
});

test("ok2", async () => {
  const x = await Async.of(1)
    .chain((x) =>
      Async.fromPromise(fakeFetch)(
        "https://jsonplaceholder.typicode.com/posts/" + x
      )
    )
    .chain(toJSON)
    .map(prop("title"))
    .toPromise();
  assert.equal(
    x,
    "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
  );
});

// Thrown-path hardening tests

test("map throws becomes rejected", async () => {
  const result = await of(1)
    .map(() => {
      throw new Error("boom");
    })
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "boom");
});

test("chain throws becomes rejected", async () => {
  const result = await of(1)
    .chain(() => {
      throw new Error("oops");
    })
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "oops");
});

test("fromPromise sync throw becomes rejected", async () => {
  const bad = fromPromise(() => {
    throw new Error("bad");
  });
  const result = await bad()
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "bad");
});

test("bimap rejected function throws becomes rejected", async () => {
  const result = await Async.Rejected(1)
    .bimap(
      () => {
        throw new Error("left");
      },
      (x) => x
    )
    .toPromise()
    .catch((e) => e.message);
  assert.is(result, "left");
});

test("bichain rejected function throws becomes rejected", async () => {
  const result = await Async.Rejected(1)
    .bichain(() => {
      throw new Error("leftChain");
    }, Async.Resolved)
    .toPromise()
    .catch((e) => e.message);
  assert.is(result, "leftChain");
});

test("map invalid arg rejects with TypeError", async () => {
  const result = await Async.of(1)
    .map(123)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "Async.map expected function, got number");
});

test("chain invalid arg rejects with TypeError", async () => {
  const result = await Async.of(1)
    .chain(null)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "Async.chain expected function, got null");
});

test("chain returning non-Async rejects with TypeError", async () => {
  const result = await Async.of(1)
    .chain((x) => x + 1)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(
    result,
    "Async.chain expected function returning Async, got number"
  );
});

test("bimap invalid args reject with TypeError", async () => {
  const result = await Async.of(1)
    .bimap(undefined, (x) => x)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(
    result,
    "Async.bimap expected functions, got undefined and function"
  );
});

test("bichain left returns non-Async rejects with TypeError", async () => {
  const result = await Async.Rejected(1)
    .bichain(() => 2, Async.Resolved)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(
    result,
    "Async.bichain expected rejected function returning Async, got number"
  );
});

test("fold right returns non-Async rejects with TypeError", async () => {
  const result = await Async.Resolved(1)
    .fold(Async.Rejected, () => 2)
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(
    result,
    "Async.fold expected resolved function returning Async, got number"
  );
});

test("fromPromise invalid input rejects with TypeError", async () => {
  const bad = Async.fromPromise(42);
  const result = await bad()
    .toPromise()
    .then(
      () => "ok",
      (e) => e.message
    );
  assert.is(result, "Async.fromPromise expected function, got number");
});

test.run();
