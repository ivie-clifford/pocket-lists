import { nowISO, uid, type PocketData, type PocketItem, type PocketList } from "./types";

const TEMPLATES: Record<string, string[]> = {
  Packing: ["Phone charger", "Toothbrush & toiletries", "Change of clothes", "Medication", "ID & wallet", "Headphones"],
  "Weekly reset": ["Clear the fridge", "Laundry", "Plan meals for the week", "Check the calendar", "Water plants", "Tidy the desk"],
  "Gym bag": ["Shoes", "Water bottle", "Towel", "Lock", "Headphones", "Change of clothes"],
  "Launch checklist": ["Final proofread", "Test every link", "Write the announcement", "Schedule posts", "Tell the people who helped"],
  Errands: ["Post office", "Pharmacy", "Groceries", "Return library books"],
};

export function seedTemplates(): PocketData {
  const t = nowISO();
  const lists: PocketList[] = [];
  const items: PocketItem[] = [];
  Object.entries(TEMPLATES).forEach(([title, entries], li) => {
    const id = uid();
    lists.push({ id, title, kind: "template", archived: false, order: li, createdAt: t, updatedAt: t });
    entries.forEach((text, i) =>
      items.push({ id: uid(), listId: id, text, done: false, order: i, createdAt: t, updatedAt: t }),
    );
  });
  return { lists, items };
}
