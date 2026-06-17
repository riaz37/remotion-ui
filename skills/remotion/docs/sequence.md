# sequence

> Official: [https://www.remotion.dev/docs/sequence](https://www.remotion.dev/docs/sequence)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/sequence.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/sequence.mdx)
> Mirrored: 2026-06-17

```twoslash include example
const BlueSquare: React.FC = () => 
// - BlueSquare
```

By using a sequence, you can time-shift the display of your components or parts of your animation in the video.

```tsx twoslash title="MyTrailer.tsx"

export const Intro = () => <>;
export const Clip = () => <>;
export const Outro = () => <>;

// ---cut---

const MyTrailer = () => {
  return (
    <>
      
        
      
      
        
      
      
        
      
    
  );
};
```

- `` will show from frame 0–29.
- `` will show from frame 30 until frame 59.
- `` will show from frame 60 until the end of the composition.

All children of a `` that call [`useCurrentFrame()`](/docs/use-current-frame) will receive a value that is shifted by [`from`](#from).

```tsx twoslash title="MyTrailer.tsx"

const Intro = () => {useCurrentFrame()};

const MyTrailer = () => {
  return (
    <>
      
      
        
      
    
  );
};
```

- At frame `0`, this would render `0`.
- At frame `30`, this would render `300`.

Using the [`durationInFrames`](#durationinframes) prop, you can define for how long the children of a `` should be mounted.

By default, the children of a `` are wrapped in an [``](/docs/absolute-fill) component. If you don't want this behavior, add [`layout="none"`](#layout) as a prop.

## Cascading

You can nest sequences within each other and they will cascade.  
For example, a sequence that starts at frame 60 which is inside a sequence that starts at frame 30 will have it's children start at frame 90.

## Examples

All the examples below are based on the following animation of a blue square:





```tsx twoslash title="MyVideo.tsx"
// @include: example-BlueSquare
// ---cut---
const MyVideo = () => {
  return ;
};
```

### Delay

If you would like to delay the content by say 30 frames, you can wrap it in  ``.




```tsx twoslash title="delay.tsx"
// @include: example-BlueSquare
// ---cut---
const MyVideo = () => {
  return (
    
      
    
  );
};
```

### Trim end

Wrap your component in a `` with a finite `durationInFrames` prop to make it unmount after the duration has passed.




```tsx twoslash title="trim-end.tsx"
// @include: example-BlueSquare
// ---cut---
const ClipExample: React.FC = () => {
  return (
    
      
    
  );
};
```

### Trim start

Wrap the square in `` with a negative `from` value to trim the beginning of the content.  
By shifting the time backwards, the animation has already progressed by 15 frames when the content appears.




```tsx title="trim-start.tsx"
const TrimStartExample: React.FC = () => {
  return (
    
      
    
  );
};
```

### Trim and delay

Wrap the content in two ``'s.  
To the inner one, pass a negative start value `from={-15}` to trim away the first 15 frames of the content.  
To the outer one we pass a positive value `from={30}` to then shift it forwards by 30 frames.




```tsx twoslash title="trim-and-delay.tsx"
// @include: example-BlueSquare
// ---cut---
const TrimAndDelayExample: React.FC = () => {
  return (
    
      
        
      
    
  );
};
```

## Play Sequences sequentially

See the [``](/docs/series) helper component, which helps you calculate markup that makes sequences play after each other.

## Props

The Sequence component is a high order component and accepts, besides children, the following props:

### `from?`

(optional from v3.2.36, _required_ in previous versions)

At which frame it's children should assume the video starts. When the sequence is at `frame`, it's children are at frame `0`.
From v3.2.36 onwards, this prop will be optional; by default, it will be 0.

### `durationInFrames?`

For how many frames the sequence should be displayed. Children are unmounted if they are not within the time range of display. By default it will be `Infinity` to avoid limit the duration of the sequence.

### `freeze?`

Freezes the children of the sequence at the specified frame.
Pass `null` or omit the prop to keep the sequence unfrozen.

```tsx twoslash title="MyVideo.tsx"

const Child = () => {useCurrentFrame()};

// ---cut---

export const MyVideo = () => {
  return (
    
      
    
  );
};
```

This is equivalent to wrapping the children in [``](/docs/freeze), but without remounting the sequence.

### `height?`

Gives the sequence a specific `style={{height: height}}` style and overrides `height` that is returned by the [`useVideoConfig()`](/docs/use-video-config) hook in child components. Useful for including a component that was designed for a specific height.

### `width?`

Gives the sequence a specific `style={{width: width}}` style and overrides `width` that is returned by the [`useVideoConfig()`](/docs/use-video-config) hook in child components. Useful for including a component that was designed for a specific width.

### `name?`

You can give your sequence a name and it will be shown as the label of the sequence in the timeline of the Remotion Studio. This property is purely for helping you keep track of sequences in the timeline.

### `layout?`

Either `"absolute-fill"` _(default)_ or `"none"`. By default, your sequences will be absolutely positioned, so they will overlay each other. If you would like to opt out of it and handle layouting yourself, pass `layout="none"`. Available since v1.4.

### `outlineRef?`

A React ref pointing to the element that the Remotion Studio should use for drawing the selection outline in the preview.

By default, the Studio outlines the wrapper created by ``. If you use `layout="none"`, no wrapper exists, so pass `outlineRef` to make the rendered element selectable in the preview.

```tsx twoslash title="MyVideo.tsx"

export const MyVideo = () => {
  const outlineRef = useRef(null);

  return (
    
      Selectable in the Studio preview
    
  );
};
```

### `style?`

CSS styles to be applied to the container. If `layout` is set to `none`, there is no container and setting this style is not allowed.

### `className?`

A class name to be applied to the container. If `layout` is set to `none`, there is no container and setting this style is not allowed.

### `premountFor?`

[Premount](/docs/player/premounting) the sequence for a set number of frames.
From [v5.0](/docs/5-0-migration), the default value changes from `0` to `fps` (1 second).

### `postmountFor?`

Same as `premountFor`, but for after the sequence has ended.  
Use this only if you expect the user to frequently seek backwards in the timeline and you want to avoid flickers for this behavior.

### `styleWhilePremounted?`

CSS styles to be applied to the container while the sequence is premounted.  
The `style` is still applied, but `styleWhilePremounted` can override properties.

### `showInTimeline?`

If set to `false`, the track will not be shown in the Studio's timeline.  
Child ``'s will show by default, unless `showInTimeline` is also set to false.  
This behavior is stable as of v4.0.110, previously the behavior was different, but this prop not documented.

### `hidden?`

If set to `true`, the sequence and its children are not rendered.

The eye icon in the Studio timeline toggles this prop and persists it to your source code.

## Adding a ref

You can add a [React ref](https://react.dev/learn/manipulating-the-dom-with-refs) to an `` from version `v3.2.13` on. If you use TypeScript, you need to type it with `HTMLDivElement`:

```tsx twoslash

const content = Hello, World;
// ---cut---
const MyComp = () => {
  const ref = useRef(null);
  return (
    
      {content}
    
  );
};
```

## Note for `@remotion/three`

A `` by default will return a `` component which is not allowed inside a [``](/docs/three-canvas).  
Avoid an error by passing `layout="none"` to ``. Example: ``.

## Compatibility



## See also

- [Source code for this component](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/Sequence.tsx)
- [Reuse components using Sequences](/docs/reusability)
- [``](/docs/composition)
- [``](/docs/series)