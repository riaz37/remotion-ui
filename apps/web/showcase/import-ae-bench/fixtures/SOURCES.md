# import-ae bench fixtures — sources and licences

Every file here is redistributable. Files are unmodified copies unless marked
"derived"; derived files are produced by `../make-animated.mjs` from the named
original and carry the original's licence.

## Airbnb lottie-android — Apache License 2.0

Source: https://github.com/airbnb/lottie-android (`snapshot-tests/src/main/assets/`),
licence: https://github.com/airbnb/lottie-android/blob/master/LICENSE (Apache-2.0).
Copyright 2018 Airbnb, Inc.

| File | Original path |
|------|---------------|
| `lottie-logo-1.json` | `Lottie Logo 1.json` |
| `lottie-logo-2.json` | `Lottie Logo 2.json` |
| `hamburger-arrow.json` | `HamburgerArrow.json` |
| `android-wave.json` | `AndroidWave.json` |
| `check-switch.json` | `Tests/CheckSwitch.json` |
| `split-dimensions.json` | `Tests/SplitDimensions.json` |
| `time-stretch-precomp.json` | `Tests/TimeStretchPrecomp2.json` |
| `repeater-animated.json` | `Tests/Repeater.json` |
| `repeater-animated-single.json` | derived from `Tests/Repeater.json` (second repeater removed) |
| `trim-paths.json` | `Tests/TrimPaths.json` |
| `trim-wrap-around.json` | `Tests/TrimPathWrapAround.json` |
| `gradient-fill-animated.json` | `Tests/GradientFill.json` |
| `shape-types.json` | `Tests/ShapeTypes.json` |

## LottieFiles lottie-docs — Creative Commons Attribution 4.0

Source: https://github.com/LottieFiles/lottie-docs (`docs/static/examples/`),
licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
Attribution: "Lottie Docs" by LottieFiles and contributors.

| File | Original path |
|------|---------------|
| `bouncy-ball.json` | `bouncy_ball.json` |
| `repeater.json` | `repeater.json` |
| `star-splosion.json` | `precomp/star-splosion.json` |
| `remapping.json` | `remapping.json` |
| `gradient.json` | `gradient.json` |
| `zig-zag.json` | `zig-zag.json` |
| `offset-path.json` | `offset-path.json` |
| `pucker-bloat.json` | `pucker_bloat.json` |
| `trim-path.json` | `trim_path.json` |
| `offset-path-animated.json` | derived from `offset-path.json` (amount keyframed) |
| `pucker-bloat-animated.json` | derived from `pucker_bloat.json` (amount keyframed) |
| `zig-zag-animated.json` | derived from `zig-zag.json` (size keyframed, 3 ridges) |

Note: the lottie-docs originals set static modifier values for the docs
playground, so they only prove static geometry; the derived files cover the
animated case.
