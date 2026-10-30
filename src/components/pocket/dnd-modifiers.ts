import type { Modifier } from "@dnd-kit/core";

export const restrictToVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });
