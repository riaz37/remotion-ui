# use-current-frame

> Official: [https://www.remotion.dev/docs/use-current-frame](https://www.remotion.dev/docs/use-current-frame)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/use-current-frame.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/use-current-frame.mdx)
> Mirrored: 2026-06-17

With this hook, you can retrieve the current frame of the video. Frames are 0-indexed, meaning the first frame is `0`, the last frame is the duration of the composition in frames minus one. To learn more about how Remotion works with time, read the page about [the fundamentals](/docs/the-fundamentals).

If the component you are writing is wrapped in a [``](/docs/sequence), `useCurrentFrame` will return the frame relative to when the Sequence starts.

Say the timeline marker is positioned at frame 25. In the example below, `useCurrentFrame()` will return `25`, except within the Subtitle component, where it will return `15` because it is within a sequence that starts at frame 10.

```tsx twoslash

const Title = () => {
  const frame = useCurrentFrame(); // 25
  return {frame};
};

const Subtitle = () => {
  const frame = useCurrentFrame(); // 15
  return {frame};
};

const MyVideo = () => {
  const frame = useCurrentFrame(); // 25

  return (
    
      
      
        
      
    
  );
};
```

Using ``'s, you can compose multiple elements together and time-shift them independently from each other without changing their animation.

### Getting the absolute frame of the timeline

In rare circumstances, you want access to the absolute frame of the timeline inside a sequence, use `useCurrentFrame()` at the top-level component and then pass it down as a prop to the children of the ``.

```tsx twoslash

// ---cut---

const Subtitle: React.FC = ({absoluteFrame}) => {
  console.log(useCurrentFrame()); // 15
  console.log(absoluteFrame); // 25

  return null;
};

const MyVideo = () => {
  const frame = useCurrentFrame(); // 25

  return (
    
      
    
  );
};
```

## Compatibility



## See also

- [Source code for this function](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/use-current-frame.ts)
- [useVideoConfig()](/docs/use-video-config)
- [``](/docs/sequence)