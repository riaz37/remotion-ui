# series

> Official: [https://www.remotion.dev/docs/series](https://www.remotion.dev/docs/series)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/series.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/series.mdx)
> Mirrored: 2026-06-07

Using this component, you can easily stitch together scenes that should play sequentially after another.

## Example

### Code

```twoslash include example
const Square: React.FC = () => 
// - Square
```

```tsx twoslash title="src/Example.tsx"
// @include: example-Square
// ---cut---

export const Example: React.FC = () => {
  return (
    
      
        
      
      
        
      
      
        
      
    
  );
};
```

### Result



## `` props

Since , `` is a [``](/docs/sequence) under the hood and accepts all of its props, with `layout` defaulting to `"none"`.

Apart from the props listed below, all props from [``](/docs/sequence) are accepted.

### `layout?`

Either `"absolute-fill"` or `"none"` _(default)_. If set to `"absolute-fill"`, the series is wrapped in an [``](/docs/absolute-fill) container.

## `` props

A `` component accepts the following props:

### `durationInFrames?`

For how many frames the sequence should be displayed. Children are unmounted if they are not within the time range of display.

Only the last `` instance is allowed to have `Infinity` as a duration, all previous one must have a positive integer.

### `offset?`

Pass a positive number to delay the beginning of the sequence. Pass a negative number to start the sequence earlier, and to overlay the sequence with the one that comes before.

The offset does not apply to sequences that come before, but the sequences that come after it will also be shifted.

**Example 1**: Pass `10` to delay the sequence by 10 frames and create a blank space of 10 frames before it.  
**Example 2**: Pass `-10` to start the sequence earlier and overlay the sequence on top of the previous one for 10 frames.

### `layout?`

Either `"absolute-fill"` _(default)_ or `"none"` By default, your sequences will be absolutely positioned, so they will overlay each other. If you would like to opt out of it and handle layouting yourself, pass `layout="none"`.

### `style?`

CSS styles to be applied to the container. If `layout` is set to `none`, there is no container and setting this style is not allowed.

### `className?`

A class name to be applied to the container. If `layout` is set to `none`, there is no container and setting this style is not allowed.

### `premountFor?`

[Premount](/docs/player/premounting) the sequence for a set number of frames.

### `ref?`

You can add a [React ref](https://react.dev/learn/manipulating-the-dom-with-refs) to a ``. If you use TypeScript, you need to type it with `HTMLDivElement`:

```tsx twoslash title="src/Example.tsx"
const Square: React.FC = () => null;
// ---cut---

export const Example: React.FC = () => {
  const first = useRef(null);
  const second = useRef(null);

  return (
    
      
        
      
      
        
      
      
        
      
    
  );
};
```

## Compatibility



## See also

- [Source code for this function](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/series/index.tsx)
- [``](/docs/sequence)