export function useFormHelper() {
  function getDifferences(obj1: any, obj2: any): any {
    // Nothing to do
    if (obj1 === obj2) {
      return undefined;
    }

    // Check direct cases
    if (
      typeof obj1 !== typeof obj2 ||
      typeof obj1 !== 'object' ||
      !obj1 ||
      !obj2 ||
      ((Array.isArray(obj1) || obj1 instanceof Date) && JSON.stringify(obj1) !== JSON.stringify(obj2))
    ) {
      return obj2;
    }

    // Check file
    if (obj2 instanceof File && obj1.id && obj1.filename && obj1.chunkSize && obj1.contentType) {
      return obj1?.chunkSize !== obj2?.size || obj1?.filename !== obj2?.name ? obj2 : undefined;
    }

    // Get changes
    const diff: Record<string, any> = {};
    for (const key of Object.keys(obj2)) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff[key] = getDifferences(obj1[key], obj2[key]);
      }
    }
    return Object.keys(diff).length ? diff : undefined;
  }

  return {
    getDifferences,
  };
}
