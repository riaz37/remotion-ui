/**
 * One source for the pitch. The section, the page, and the exit prompt make
 * the same promise, so the copy lives in one place rather than drifting
 * across three files.
 */
export const earlyAccessCopy = {
  name: "Cutaway",
  eyebrow: "Cutaway · Early access",
  /** The one-line answer to "what is Cutaway". Used wherever the name appears cold. */
  definition:
    "Cutaway films your own running app and cuts the footage into a demo video.",
  title: "Ship your product demo without opening After Effects",
  lead: "One command against your own localhost. What comes back is a Remotion project you own, with every frame checked before you watch one.",
  bullets: [
    "Runs against your app, not a stock template",
    "Exports real Remotion source you can edit and re-render",
    "Vertical, square, and widescreen from the same cut",
  ],
  assurance:
    "One email the moment your spot opens. Nothing before that, and we never share the list.",
  modalTitle: "Before you go: want Cutaway early?",
  modalLead:
    "Cutaway films your own app and cuts it into a demo video. We're opening a small first round — leave an email and we'll tell you when your spot is ready.",
} as const;
