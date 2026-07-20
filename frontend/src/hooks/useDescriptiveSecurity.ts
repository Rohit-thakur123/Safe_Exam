import { useEffect } from "react";

const blockedKeys = [
  "F12",
];

export default function useDescriptiveSecurity() {
  useEffect(() => {

    // Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable Copy / Paste / Cut / Drag
    const preventAction = (e: Event) => {
      e.preventDefault();
    };

    // Disable Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {

      // F12
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }

      // Ctrl Shortcuts
      if (e.ctrlKey) {

        const key = e.key.toLowerCase();

        if (
          key === "c" || // Copy
          key === "v" || // Paste
          key === "x" || // Cut
          key === "a" || // Select All
          key === "u"    // View Source
        ) {
          e.preventDefault();
          return;
        }
      }

      // Ctrl + Shift + I
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "i"
      ) {
        e.preventDefault();
      }

    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("dragstart", preventAction);
    document.addEventListener("drop", preventAction);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("dragstart", preventAction);
      document.removeEventListener("drop", preventAction);
      document.removeEventListener("keydown", handleKeyDown);
    };

  }, []);
}