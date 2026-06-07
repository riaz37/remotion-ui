# RemotionUI Docs — Mockup Specifications

Textual mockups for implementation. Direction: **Studio Blue** (Remotion-adjacent).

## 1. Homepage

```
┌─────────────────────────────────────────────────────────────────┐
│ [◈] RemotionUI          Documentation  Components  CLI    [GH]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROGRAMMATIC VIDEO COMPONENTS          ┌─────────────────────┐ │
│                                         │                     │ │
│  Copy-paste Remotion                    │   [Intro Player]    │ │
│  video components you own.              │   live autoplay     │ │
│                                         │                     │ │
│  48 components · CLI registry           └─────────────────────┘ │
│                                                                 │
│  ┌ Quick start ──────────────────────────────── [copy] ┐       │
│  │ npx remotion-ui@latest init my-video                 │       │
│  └──────────────────────────────────────────────────────┘       │
│  [Read the docs]  [Browse atlas]                                │
│                                                                 │
│  ─── How it works ─────────────────────────────────────────── │
│  ① init project  →  ② add components  →  ③ compose in Remotion │
│                                                                 │
│  ─── Component Atlas ─────────────────────── [Atlas guide →] ─ │
│  [All] [Atoms] [Signals] [Vectors] [Spatial] [Blocks] [Cuts]  │
│                                                                 │
│  Atoms · 14 components                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │                        │
│  │ fade-in  │ │ slide-up │ │ scale-in │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Component reference page

```
┌──────── sidebar ────────┬──────── content (lg: 2-col) ────────────────┐
│ Signals                 │  Signals                                    │
│  Caption Highlight      │  Caption Scene                              │
│  Caption Scene ◀        │  Lower-third captions synced to audio.      │
│                         │  Scene · signals · advanced                 │
│                         │                                             │
│                         │  ┌─ prose / install ─────┐ ┌ Live preview ┐│
│                         │  │ Install [copy]        │ │              ││
│                         │  │ npx remotion-ui add…  │ │   [Player]   ││
│                         │  │                       │ │   sticky     ││
│                         │  │ Description…          │ │              ││
│                         │  │ Usage / API table     │ └──────────────┘│
│                         │  └───────────────────────┘                  │
└─────────────────────────┴─────────────────────────────────────────────┘
```

## 3. Docs prose page (Introduction)

```
┌──────── sidebar ────────┬──────── content ────────────────────────────┐
│ Introduction ◀          │  Introduction                               │
│ Installation            │  Copy-paste Remotion video components…      │
│                         │                                             │
│                         │  [Init command block]                       │
│                         │                                             │
│                         │  ## How it works                            │
│                         │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│                         │  │ 1.Init  │ │ 2.Add   │ │ 3.Compose│      │
│                         │  └─────────┘ └─────────┘ └─────────┘       │
│                         │                                             │
│                         │  [Info callout — border-l primary]          │
└─────────────────────────┴─────────────────────────────────────────────┘
```
