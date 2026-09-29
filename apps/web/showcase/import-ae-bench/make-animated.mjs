#!/usr/bin/env node
/**
 * Derives animated variants of three static lottie-docs examples (CC BY 4.0),
 * so animated Offset Paths, Pucker & Bloat and Zig Zag parameters are covered
 * by the bench. The originals only set static values for the docs playground.
 *
 *   node showcase/import-ae-bench/make-animated.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const ease = { o: { x: [0.333], y: [0] }, i: { x: [0.667], y: [1] } };
const track = (values, frames) => ({
  a: 1,
  k: values.map((v, index) => (index < values.length - 1 ? { t: frames[index], s: [v], ...ease } : { t: frames[index], s: [v] })),
});

function derive(source, target, ty, animate) {
  const json = JSON.parse(fs.readFileSync(path.join(dir, source), "utf8"));
  let found = 0;
  const walk = (items) => {
    for (const item of items ?? []) {
      if (item.ty === "gr") walk(item.it);
      if (item.ty === ty) {
        animate(item);
        found += 1;
      }
    }
  };
  for (const layer of json.layers) walk(layer.shapes);
  if (found === 0) throw new Error(`${source}: no "${ty}" item`);
  json.nm = `${json.nm ?? source} (animated variant)`;
  fs.writeFileSync(path.join(dir, target), JSON.stringify(json));
  console.log(`${target}: animated ${found} ${ty} item(s)`);
}

derive("offset-path.json", "offset-path-animated.json", "op", (item) => {
  item.a = track([-20, 25, 0], [0, 90, 179]);
});
derive("pucker-bloat.json", "pucker-bloat-animated.json", "pb", (item) => {
  item.a = track([-60, 80, 0], [0, 90, 179]);
});
derive("zig-zag.json", "zig-zag-animated.json", "zz", (item) => {
  item.s = track([0, 18, 6], [0, 90, 179]);
  item.r = { a: 0, k: 3 };
});

// lottie-android's Repeater.json stacks two repeaters, which lottie-web draws
// differently from AE's rule; a single-repeater variant isolates the animated
// offset / anchor / rotation maths so it can be scored against lottie-web.
{
  const json = JSON.parse(fs.readFileSync(path.join(dir, "repeater-animated.json"), "utf8"));
  const shapes = json.layers[0].shapes;
  const second = shapes.findLastIndex((s) => s.ty === "rp");
  json.layers[0].shapes = shapes.filter((_, index) => index !== second);
  json.nm = "Repeater (single animated repeater variant)";
  fs.writeFileSync(path.join(dir, "repeater-animated-single.json"), JSON.stringify(json));
  console.log("repeater-animated-single.json: dropped the second repeater");
}
