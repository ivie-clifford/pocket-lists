import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const Drawer = ({
  shouldScaleBackground = false,
  repositionInputs = false,
  handleOnly = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    repositionInputs={repositionInputs}
    handleOnly={handleOnly}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-foreground/30", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

function useIsDesktop() {
  const [desktop, setDesktop] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return desktop;
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const setPanelRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const desktop = useIsDesktop();
  const [viewport, setViewport] = React.useState<{ height: number; top: number } | null>(null);
  const keepFieldVisible = React.useCallback(() => {
    const field = document.activeElement;
    const panel = panelRef.current;
    if (
      desktop ||
      !panel ||
      !(field instanceof HTMLElement) ||
      !panel.contains(field) ||
      !field.matches("input, textarea, select")
    )
      return;
    // Safari scrolls for focus before the keyboard finishes resizing the viewport.
    // Correct only the panel's inner scroller after its new height is applied;
    // never refocus the field, reset its caret, or scroll the background document.
    for (
      let parent = field.parentElement;
      parent && parent !== panel;
      parent = parent.parentElement
    ) {
      if (
        !/auto|scroll/.test(getComputedStyle(parent).overflowY) ||
        parent.scrollHeight <= parent.clientHeight
      )
        continue;
      const bounds = parent.getBoundingClientRect();
      const rect = field.getBoundingClientRect();
      if (rect.top < bounds.top + 12 || rect.height > bounds.height - 24) {
        parent.scrollTop += rect.top - bounds.top - 12;
      } else if (rect.bottom > bounds.bottom - 12) {
        parent.scrollTop += rect.bottom - bounds.bottom + 12;
      }
      break;
    }
  }, [desktop]);
  React.useEffect(() => {
    const frame = requestAnimationFrame(keepFieldVisible);
    return () => cancelAnimationFrame(frame);
  }, [viewport?.height, viewport?.top, keepFieldVisible]);
  React.useEffect(() => {
    const visible = window.visualViewport;
    const update = () =>
      setViewport({
        height: visible?.height ?? window.innerHeight,
        top: visible?.offsetTop ?? 0,
      });
    update();
    visible?.addEventListener("resize", update);
    visible?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      visible?.removeEventListener("resize", update);
      visible?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={setPanelRef}
        className={cn(
          "fixed z-50 flex min-h-0 w-full max-w-lg flex-col overflow-hidden border bg-background",
          desktop
            ? "top-1/2 left-1/2 max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-xl"
            : "inset-x-0 mx-auto rounded-t-3xl pb-safe",
          className,
        )}
        style={
          desktop
            ? { ...style }
            : {
                top: viewport ? viewport.top + viewport.height * 0.04 : "4dvh",
                height: viewport ? viewport.height * 0.92 : "92dvh",
                ...style,
              }
        }
        {...props}
        onFocusCapture={(event) => {
          props.onFocusCapture?.(event);
          requestAnimationFrame(keepFieldVisible);
        }}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          returnFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          // Enter the modal focus scope without opening the phone keyboard.
          // Radix can then contain Tab/Shift+Tab and outside focus correctly.
          event.preventDefault();
          if (event.target instanceof HTMLElement) event.target.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented && returnFocus.current?.isConnected) {
            // These panels use controlled open state rather than DrawerTrigger.
            event.preventDefault();
            returnFocus.current.focus({ preventScroll: true });
          }
          returnFocus.current = null;
        }}
      >
        {!desktop && (
          <DrawerPrimitive.Handle className="mx-auto mt-3 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
