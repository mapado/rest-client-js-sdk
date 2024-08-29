function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// eslint-disable-next-line import/prefer-default-export
export function findClosestWord(
  word: string,
  list: string[],
  maxDistance = Infinity
): string | null {
  let closestWord: string | null = null;
  let minDistance = Infinity;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < list.length; i += 1) {
    const candidate = list[i];
    const distance = levenshteinDistance(word, candidate);

    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closestWord = candidate;
    }
  }

  return closestWord;
}
