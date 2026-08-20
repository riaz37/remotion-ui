/**
 * One source for the pitch. The section, the page, and the exit prompt make
 * the same promise, so the copy lives in one place rather than drifting
 * across three files.
 */
export const earlyAccessCopy = {
  eyebrow: "Early access",
  title: "Ship your product demo without opening After Effects",
  lead: "One command, pointed at your own localhost. It drives your real UI, cuts the capture into a Remotion project you own, and checks every frame before you watch one.",
  bullets: [
    "Runs against your app, not a stock template",
    "Exports real Remotion source you can edit and re-render",
    "Vertical, square, and widescreen from the same cut",
  ],
  assurance:
    "One email the moment your spot opens. Nothing before that, and we never share the list.",
  modalTitle: "Before you go: want early access?",
  modalLead:
    "We're opening a small first round of the demo-video tool. Leave an email and we'll tell you when your spot is ready.",
} as const;
