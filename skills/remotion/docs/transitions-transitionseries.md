# transitions/transitionseries

> Official: [https://www.remotion.dev/docs/transitions/transitionseries](https://www.remotion.dev/docs/transitions/transitionseries)
> Source MDX: [https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/transitions/transitionseries.mdx](https://raw.githubusercontent.com/remotion-dev/remotion/main/packages/docs/docs/transitions/transitionseries.mdx)
> Mirrored: 2026-06-17

# &lt;TransitionSeries&gt;

The `` component behaves the same as the [``](/docs/series) component, but allows for [``](#transitionseriestransition) and [``](#transitionseriesoverlay) components to be rendered between [``](#transitionseriessequence) components.

Between any two sequences, you can place either a transition or an overlay:

- A [``](#transitionseriestransition) crossfades, slides, or otherwise animates between two scenes.  
  It [shortens](#duration-of-a-transitionseries) the total duration because both scenes overlap during the transition.
- A [``](#transitionseriesoverlay) renders children on top of the cut point without affecting timing.  
  The sequences remain at full length — useful for effects like [light leaks](/docs/light-leaks/light-leak) or flashes.

### Transition example

```tsx twoslash title="TransitionExample.tsx"
const Fill = ({color}: {color: string}) => ;

// ---cut---

export const TransitionExample: React.FC = () => {
  return (
    
      
        
      
      
      
        
      
      
      
        
      
    
  );
};
```



### Overlay example

```tsx twoslash title="OverlayExample.tsx"
const Fill = ({color}: {color: string}) => ;

// ---cut---

export const OverlayExample: React.FC = () => {
  return (
    
      
        
      
      
        
      
      
        
      
    
  );
};
```



## API

### ``

Inherits the [`from`](/docs/sequence#from), [`name`](/docs/sequence#name), [`className`](/docs/sequence#classname), and [`style`](/docs/sequence#style) props from [``](/docs/sequence).

The `` component can only contain ``, ``, and `` components.

### ``

Inherits the [`durationInFrames`](/docs/sequence#durationinframes), [`name`](/docs/sequence#name), [`className`](/docs/sequence#classname), [`style`](/docs/sequence#style), [`showInTimeline`](/docs/sequence#showintimeline), [`freeze`](/docs/sequence#freeze), [`premountFor`](/docs/sequence#premountfor), [`postmountFor`](/docs/sequence#postmountfor) and [`layout`](/docs/sequence#layout) props from [``](/docs/sequence).

As children, put the contents of your scene.

### ``

Placed between two sequences to animate from one scene to the next.  
During the transition, both scenes are rendered simultaneously and the total duration is [shortened](#duration-of-a-transitionseries) by the transition length.

Takes two props:

- `timing`: A timing of type `TransitionTiming`. See [Timings](/docs/transitions/timings) for more information.
- `presentation?`: A presentation of type `TransitionPresentation`. If not specified, the default value is [`slide()`](/docs/transitions/presentations/slide). See [Presentations](/docs/transitions/presentations) for more information.

Must be a direct child of ``.
At least one `` component must come before or after the `` component.

### ``

Placed between two sequences to render children on top of the cut point.  
The overlay does [not shorten](#duration-of-a-transitionseries) the timeline — adjacent sequences remain at full length.

The overlay is centered on the cut point by default: half the duration before the cut, half after.  
Children animate independently — no progress context is provided.

Takes two props:

- `durationInFrames`: How long the overlay is visible. Must be a positive integer.
- `offset?`: Shifts the overlay relative to the center of the cut point. Positive values shift right (later), negative values shift left (earlier). Default: `0`. Must be a finite integer.

The overlay must not extend before frame 0 or beyond the duration of the adjacent sequences.

## Enter and exit animations

You don't necessarily have to use `` for transitions between scenes. You can also use it to animate the entrace or exit of a scene by putting a transition first or last in the ``.

```tsx twoslash title="SlideTransition.tsx"

const Letter: React.FC = ({children, color}) => {
  return (
    
      {children}
    
  );
};
// ---cut---

const BasicTransition = () => {
  return (
    
      
        A
      
      
    
  );
};
```



## Duration of a ``

[Transitions](#transitionseriestransition) shorten the total duration because both scenes overlap.  
[Overlays](#transitionseriesoverlay) do not — the total duration stays the same as if no overlay was present.

Consider this example:

```tsx twoslash title="SlideTransition.tsx"

const Letter: React.FC = ({children, color}) => {
  return (
    
      {children}
    
  );
};
// ---cut---

const BasicTransition = () => {
  return (
    
      
        A
      
      
      
        B
      
    
  );
};
```

`A` is visible for 40 frames, `B` for 60 frames and the duration of the transition is 30 frames.
During this time, both slides are rendered. This means the total duration of the animation is `60 + 40 - 30 = 70`.




Example with 3 slides

```tsx twoslash title="SlideTransition.tsx"

const Letter: React.FC = ({children, color}) => {
  return (
    
      {children}
    
  );
};
// ---cut---

const BasicTransition = () => {
  return (
    
      
        A
      
      
      
        B
      
      
      
        C
      
    
  );
};
```

- The first slide is shown for 40 frames
- The second slide is shown for 60 frames
- The third slide is shown for 90 frames
- There are two transitions, one 30 frames long and one 45 frames long

1. Sum up the durations: `40 + 60 + 90 = 190`
2. Subtract the duration of the transitions: `190 - 30 - 45 = 115`



## Getting the duration of a transition

You can get the duration of a transition by calling `getDurationInFrames()` on the timing:

```tsx twoslash title="Assuming a framerate of 30fps"

springTiming({config: {damping: 200}}).getDurationInFrames({fps: 30}); // 23
```

## Rules

1 A transition must not be longer than the duration of the previous or next sequence.

2 Two transitions cannot be adjacent.

3 Two overlays cannot be adjacent.

4 A transition and an overlay cannot be adjacent — they occupy the same slot between sequences.

5 There must be at least one sequence before or after a transition or overlay.

## See also

- [Source code for this function](https://github.com/remotion-dev/remotion/blob/main/packages/transitions/src/TransitionSeries.tsx)
- [Transitions](/docs/transitioning)
- [Timings](/docs/transitions/timings)
- [Presentations](/docs/transitions/presentations)
- [``](/docs/series)