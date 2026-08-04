# absolute-fill

> Official: [https://www.remotion.dev/docs/absolute-fill](https://www.remotion.dev/docs/absolute-fill)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/absolute-fill.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/absolute-fill.mdx)
> Mirrored: 2026-08-04

A helper component - it is an absolutely positioned `` with the following styles:

```ts twoslash title="Styles of AbsoluteFill"
// ---cut---
const style: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};
```

This component is useful for layering content on top of each other. For example, you can use it to create a full-screen video background:

```tsx twoslash title="Layer example"

const MyComp = () => {
  return (
    
      
        
      
      
        This text is written on top!
      
    
  );
};
```

The layers that get rendered last appear on top - this is because of how HTML works.

## API

### Inherited props

`` inherits [`from`](/docs/sequence#from), [`durationInFrames`](/docs/sequence#durationinframes), [`trimBefore`](/docs/sequence#trimbefore), [`freeze`](/docs/sequence#freeze), [`hidden`](/docs/sequence#hidden), [`name`](/docs/sequence#name) and [`showInTimeline`](/docs/sequence#showintimeline) from [``](/docs/sequence).

It is registered as a layer in the [Remotion Studio](/docs/studio) timeline.

:::note
You can still wrap `` in an outer [``](/docs/sequence). Timing [cascades](/docs/sequence#cascading) like nested sequences.
:::

```tsx twoslash title="Clip starting at frame 30, lasting 90 frames"

export const MyComp: React.FC = () => {
  return (
    
      This layer is visible from frame 30 to 119.
    
  );
};
```

### `ref?`

You can add a [React ref](https://react.dev/learn/manipulating-the-dom-with-refs) to an `` from version `v3.2.13` on. If you use TypeScript, type it with `HTMLDivElement`:

```tsx twoslash title="MyComp.tsx"

const content = Hello, World;
// ---cut---
const MyComp = () => {
  const ref = useRef(null);
  return {content};
};
```

### Other props

All props of a regular `` element are forwarded, including `className`, `style` and event handlers.

## TailwindCSS class detection

This component has a `style` object, which has higher importance than `className`'s.

In order to make this behave like you expect (row layout):

```tsx

```

We detect conflicting Tailwind classes and disable the corresponding inline styles if they are present from Remotion v4.0.249.  
Review the source code below to see how we detect Tailwind classes.

## Compatibility



## See also

- [Source code for this component](https://github.com/remotion-dev/remotion/blob/main/packages/core/src/AbsoluteFill.tsx)