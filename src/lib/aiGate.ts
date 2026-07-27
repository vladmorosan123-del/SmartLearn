// Poarta pentru tutorul AI plutitor: cand un elev da un test la care profesorul
// NU a permis AI-ul, testul "inchide poarta" si widgetul AI dispare cat timp e pe test.
let blocked = false;
const listeners = new Set<() => void>();

export const aiGate = {
  isBlocked() {
    return blocked;
  },
  setBlocked(b: boolean) {
    if (b === blocked) return;
    blocked = b;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
