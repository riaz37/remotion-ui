# animating-properties

> Official: [https://www.remotion.dev/docs/animating-properties](https://www.remotion.dev/docs/animating-properties)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/animating-properties.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/animating-properties.mdx)
> Mirrored: 2026-06-07

Animation works by changing properties over time.  
Let's create a simple fade in animation.

If we want to fade the text in over 60 frames, we need to gradually change the `opacity` over time so that it goes from 0 to 1.

```tsx twoslash {4, 15} title="FadeIn.tsx"
// ---cut---
export const FadeIn = () => {
  const frame = useCurrentFrame();

  const opacity = Math.min(1, frame / 60);

  return (
    
      Hello World!
    
  );
};
```



## Using the interpolate helper function

Using the [`interpolate()`](/docs/interpolate) function can make animations more readable. The above animation can also be written as:

```tsx twoslash
const frame = useCurrentFrame();
// ---cut---

const opacity = interpolate(frame, [0, 60], [0, 1], {
  /*                        ^^^^^   ^^^^^    ^^^^
  Variable to interpolate ----|       |       |
  Input range ------------------------|       |
  Output range -------------------------------|  */
  extrapolateRight: "clamp",
});
```

In this example, we map the frames 0 to 60 to their opacity values `(0, 0.0166, 0.033, 0.05 ...`) and use the [`extrapolateRight`](/docs/interpolate#extrapolateright) setting to clamp the output so that it never becomes bigger than 1.

## Using `spring()`

The [`spring()`](/docs/spring) helper runs a spring simulation from 0 to 1 by default. Below, we use it to animate the scale of the text.

```tsx twoslash {7-12, 20}

export const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame,
  });

  return (
    
      Hello World!
    
  );
};
```

You should see the text jump in.




The default spring configuration leads to a little bit of overshoot, meaning the text will bounce a little bit. See the documentation page for [`spring()`](/docs/spring) to learn how to customize it.

## Always animate using `useCurrentFrame()`

Watch out for flickering issues during rendering that arise if you write animations that are not driven by [`useCurrentFrame()`](/docs/use-current-frame) – for example CSS transitions.

[Read more about how Remotion's rendering works](/docs/flickering) - understanding it will help you avoid issues down the road.

## See also

- [Don't use CSS animations](/docs/troubleshooting/css-animations)
- [`interpolate()`](/docs/interpolate)
- [`spring()`](/docs/spring)
- [Flickering](/docs/flickering)