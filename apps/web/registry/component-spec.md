# Component spec

Committed metadata for `pnpm gen:component`. Each lane section is a table the
generator parses: `## <lane> — +<count>` followed by rows of
`` `slug` | tags | tier | intent ``. Everything below `## Rejected` is ignored,
on purpose — it lists components that must not be built.

The original expansion spec (`docs-internal/expansion-200-spec.md`) is untracked;
the generator merges it in when present, and this file wins on conflicts. New
lanes and components are added here.

## motion — +7

| Slug | Tags | Tier | Intent |
|------|------|------|--------|
| `shape-layer` | shapes, paths | advanced | After Effects shape layer with an ordered operator stack — trim paths, repeater, offset paths, wiggle paths, zig-zag and pucker & bloat — evaluated per frame as pure geometry. |
| `text-animator` | text | advanced | After Effects text animator: range and wiggly selectors drive per-character, per-word or per-line position, scale, rotation, opacity, blur, tracking and fill over measured layout. |
| `effector-field` | mograph | advanced | Cinema 4D MoGraph cloner and effectors: clone any element into a grid, radial or linear arrangement and let animatable spherical, linear or noise falloff fields drive each clone. |
| `slit-scan` | time | advanced | Slit-scan time displacement: each strip of any child — rows, columns, rings or a gradient map — shows that child at a different moment, deterministically. |
| `ik-rig` | rigging | advanced | Two-bone inverse kinematics with rubber-hose limbs, bend direction and stretch, driven by null and target positions from keyframe tracks. |
| `track-matte` | matte, masking | advanced | After Effects track mattes: reveal any child through any other with alpha, inverted alpha, luma or inverted luma. |
| `follow-through` | secondary-motion | advanced | Overlapping action along a chain: every element follows one leader track with its own delay, drag, overshoot and settle. |

## Rejected

| Slug | Why |
|------|-----|
