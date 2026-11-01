import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

it("enters the modal without focusing an input, contains focus, and restores the opener", async () => {
  function ControlledPanel() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open editor</button>
        <button>Background action</button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerTitle>Edit task</DrawerTitle>
            <DrawerDescription>Task details</DrawerDescription>
            <textarea aria-label="Note" />
            <button onClick={() => setOpen(false)}>Done</button>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  render(<ControlledPanel />);
  const opener = screen.getByRole("button", { name: "Open editor" });
  act(() => opener.focus());
  fireEvent.click(opener);
  const panel = screen.getByRole("dialog");
  await waitFor(() => expect(panel).toHaveFocus());
  expect(screen.getByLabelText("Note")).not.toHaveFocus();
  const background = screen.getByRole("button", { name: "Background action", hidden: true });
  act(() => background.focus());
  expect(panel).toHaveFocus();
  const note = screen.getByLabelText("Note");
  act(() => note.focus());
  expect(note).toHaveFocus();
  act(() => background.focus());
  expect(note).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await waitFor(() => expect(opener).toHaveFocus());
});
