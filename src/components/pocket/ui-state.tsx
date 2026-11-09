import { createContext, useContext } from "react";

export interface UIState {
  openItem: (id: string) => void;
  openQuickAdd: (opts?: {
    listId?: string;
    mode?: "task" | "list" | "template" | "paste";
    newTemplateTitle?: string;
  }) => void;
}

export const UICtx = createContext<UIState>({ openItem: () => {}, openQuickAdd: () => {} });
export const useUI = () => useContext(UICtx);
