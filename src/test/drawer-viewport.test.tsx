import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

const originalViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalViewport) Object.defineProperty(window, "visualViewport", originalViewport);
  else Reflect.deleteProperty(window, "visualViewport");
});

it("keeps a saved note visible after keyboard resize without moving its caret", async () => {
  const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0 });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  render(
    <Drawer open>
      <DrawerContent>
        <DrawerTitle>Edit task</DrawerTitle>
        <DrawerDescription>Task details</DrawerDescription>
        <div data-testid="fields" style={{ overflowY: "auto" }}>
          <textarea aria-label="Saved note" defaultValue="Keep my existing note" />
        </div>
      </DrawerContent>
    </Drawer>,
  );
  const fields = screen.getByTestId("fields");
  const note = screen.getByLabelText("Saved note") as HTMLTextAreaElement;
  Object.defineProperties(fields, { scrollHeight: { value: 900 }, clientHeight: { value: 200 } });
  let keyboardOpen = false;
  vi.spyOn(fields, "getBoundingClientRect").mockImplementation(
    () =>
      ({ top: 100, bottom: keyboardOpen ? 300 : 700, height: keyboardOpen ? 200 : 600 }) as DOMRect,
  );
  vi.spyOn(note, "getBoundingClientRect").mockImplementation(
    () => ({ top: 400 - fields.scrollTop, bottom: 500 - fields.scrollTop, height: 100 }) as DOMRect,
  );
  act(() => {
    note.focus();
    note.setSelectionRange(4, 4);
  });
  act(() => {
    keyboardOpen = true;
    viewport.height = 350;
    viewport.dispatchEvent(new Event("resize"));
  });
  await waitFor(() => expect(fields.scrollTop).toBe(212));
  expect(note).toHaveFocus();
  expect(note.selectionStart).toBe(4);
  expect(note.selectionEnd).toBe(4);
  expect(note.value).toBe("Keep my existing note");
  // Repeated viewport events must not keep moving a field that is already visible.
  act(() => viewport.dispatchEvent(new Event("resize")));
  expect(fields.scrollTop).toBe(212);
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
