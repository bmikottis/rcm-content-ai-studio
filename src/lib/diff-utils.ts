export interface DiffChange {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export function computeDiff(original: string, updated: string): DiffChange[] {
  const originalWords = original.split(/(\s+)/);
  const updatedWords = updated.split(/(\s+)/);
  
  const changes: DiffChange[] = [];
  
  let i = 0;
  let j = 0;
  
  while (i < originalWords.length || j < updatedWords.length) {
    if (i >= originalWords.length) {
      changes.push({ type: "added", text: updatedWords[j] });
      j++;
    } else if (j >= updatedWords.length) {
      changes.push({ type: "removed", text: originalWords[i] });
      i++;
    } else if (originalWords[i] === updatedWords[j]) {
      changes.push({ type: "unchanged", text: originalWords[i] });
      i++;
      j++;
    } else {
      const foundInUpdated = updatedWords.slice(j).indexOf(originalWords[i]);
      const foundInOriginal = originalWords.slice(i).indexOf(updatedWords[j]);
      
      if (foundInUpdated === -1 && foundInOriginal === -1) {
        changes.push({ type: "removed", text: originalWords[i] });
        changes.push({ type: "added", text: updatedWords[j] });
        i++;
        j++;
      } else if (foundInUpdated === -1 || (foundInOriginal !== -1 && foundInOriginal < foundInUpdated)) {
        changes.push({ type: "added", text: updatedWords[j] });
        j++;
      } else {
        changes.push({ type: "removed", text: originalWords[i] });
        i++;
      }
    }
  }
  
  return changes;
}

export function countChanges(changes: DiffChange[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  
  for (const change of changes) {
    if (change.type === "added" && change.text.trim()) added++;
    if (change.type === "removed" && change.text.trim()) removed++;
  }
  
  return { added, removed };
}
