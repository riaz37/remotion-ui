# absolute-fill

> Official: [https://www.remotion.dev/docs/absolute-fill](https://www.remotion.dev/docs/absolute-fill)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/absolute-fill.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/absolute-fill.mdx)
> Mirrored: 2026-06-17

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

## Adding a ref

You can add a [React ref](https://react.dev/learn/manipulating-the-dom-with-refs) to an `` from version `v3.2.13` on. If you use TypeScript, you need to type it with `HTMLDivElement`:

```tsx twoslash

const content = Hello, World;
// ---cut---
const MyComp = () => {
  const ref = useRef(null);
  return {content};
};
```

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