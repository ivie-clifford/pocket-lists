import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

const originalViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
afterEach(() => {
  cleanup();
  if (originalViewport) Object.defineProperty(window, "visualViewport", originalViewport);
  else Reflect.deleteProperty(window, "visualViewport");
});

it("fits the visible viewport when a keyboard opens and preserves the focused field", () => {
  const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  render(
    <Drawer open>
      <DrawerContent>
        <DrawerTitle>Edit task</DrawerTitle>
        <DrawerDescription>Task details</DrawerDescription>
        <textarea aria-label="Note" />
      </DrawerContent>
    </Drawer>,
  );
  const panel = screen.getByRole("dialog");
  expect(panel.style.height).toBe("736px");
  const note = screen.getByLabelText("Note");
  act(() => note.focus());
  act(() => {
    viewport.height = 350;
    viewport.offsetTop = 40;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(panel.style.height).toBe("322px");
  expect(panel.style.top).toBe("54px");
  expect(note).toHaveFocus();
  act(() => {
    viewport.height = 800;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(panel.style.height).toBe("736px");
});
