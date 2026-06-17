# spring

> Official: [https://www.remotion.dev/docs/spring](https://www.remotion.dev/docs/spring)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/spring.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/spring.mdx)
> Mirrored: 2026-06-17

A physics-based animation primitive.

Example usage:

```tsx twoslash title="spring-example.ts"
// ---cut---
const frame = useCurrentFrame();
const {fps} = useVideoConfig();

const value = spring({
  frame,
  fps,
  config: {
    stiffness: 100,
  },
});
```

In the following example, the value controls the [`scale`](/docs/transforms#scale) property of the div:



To disable the default bounce, increase the [`damping`](#damping) parameter.



For a more advanced playground, visit [remotion.dev/timing-editor](https://www.remotion.dev/timing-editor).

## Parameters

### `frame`

The current time value. Most of the time you want to pass in the return value of [`useCurrentFrame()`](/docs/use-current-frame). The spring animation starts at frame 0, so if you would like to delay the animation, you can pass a different value like `frame - 20`.

### `fps`

For how many frames per second the spring animation should be calculated. This should always be the `fps` property of the return value of [`useVideoConfig()`](/docs/use-video-config).

### `from?`

_Default:_ `0`

The initial value of the animation.

### `to?`

_Default:_ `1`

The end value of the animation. Note that depending on the parameters, spring animations may overshoot the target a bit, before they bounce back to their final target.

### `reverse?`

_Default:_ `false`

Render the animation in reverse. See: [Order of operations](#order-of-operations)

### `config?`

An optional object that allows you to customize the physical properties of the animation.

#### `mass?`

_Default:_ `1`

The weight of the spring. If you reduce the mass, the animation becomes faster!

#### `damping?`

_Default_: `10`

How hard the animation decelerates.

#### `stiffness?`

_Default_: `100`

Spring stiffness coefficient. Play with this one and it will affect how bouncy your animation is.

#### `overshootClamping?`

_Default_: `false`

Determines whether the animation can shoot over the `to` value. If set to true, if the animation goes over `to`, it will just return the value of `to`.

### `durationInFrames?`

Stretches the animation curve so it is exactly as long as you specify.

```tsx twoslash title="spring-example.ts"
// ---cut---
const frame = useCurrentFrame();
const {fps} = useVideoConfig();

const value = spring({
  frame,
  fps,
  config: {
    stiffness: 100,
  },
  durationInFrames: 40,
});
```

See also: [Order of operations](#order-of-operations)

### `durationRestThreshold?`

How close the animation should be to the end in order to be considered finished for the calculation of the duration. Only has an effect if `durationInFrames` is also specified.

For example, if a `durationRestThreshold` of `0.001` is given, and the durationOfFrames is `30`, it means that after 30 frames, the spring has reached 99.9% (`1 - 0.001 = 0.999`) of it's distance to the end value.

### `delay?`

How many frames to delay the animation for.

For example, if a `delay` of `25` is given frames 0-24 will return the initial value, and the animation will effectively start from frame 25. See also: [Order of operations](#order-of-operations)

## Order of operations

Here is the order of which the `durationInFrames`, `reverse` and `delay` operations are applied:

1 First the spring animation is stretched to the duration that you pass using durationInFrames, if you pass a duration.
2 Then the animation is reversed if you pass reverse: true.
3 Then the animation is delayed if you pass delay.

## Credit

This function was taken from [Reanimated 2](https://github.com/software-mansion/react-native-reanimated), which in itself was a huge inspiration for Remotion.

## Compatibility



## See also

- [Spring animation example](/docs/animating-properties#using-spring)
- [Source code for this function](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/spring/index.ts)
- [`interpolate()`](/docs/interpolate)
- [`measureSpring()`](/docs/measure-spring)