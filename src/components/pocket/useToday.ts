import { useEffect, useState } from "react";
import { toISODate } from "@/lib/pocket/dates";

/** Today's local date, refreshed when the app returns to the foreground or the day rolls over. */
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toISODate(new Date()));
    const id = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
