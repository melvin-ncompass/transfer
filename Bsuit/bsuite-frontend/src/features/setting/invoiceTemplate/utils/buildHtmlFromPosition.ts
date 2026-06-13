export const buildHtmlFromPositions = (positions: Record<string, string[]>) => {
  const lines: Record<number, {col: string, key: string}[]> = {};

  // Step 1: group placeholders by line
  Object.entries(positions).forEach(([key, posArr]) => {
    posArr.forEach((pos) => {
      const line = parseInt(pos[0]); // first char = line number
      const col = pos[1]; // second char = column letter

      if (!lines[line]) lines[line] = [];
      lines[line].push({ col, key });
    });
  });

  // Step 2: sort by column
  const sortedLines = Object.keys(lines)
    .sort((a,b) => parseInt(a) - parseInt(b))
    .map(lineNumber => {
      const line = lines[parseInt(lineNumber)];
      line.sort((a,b) => a.col.localeCompare(b.col));
      return line.map(item => `%${item.key}%`).join(" ");
    });

  // Step 3: wrap each line in <p>
  return sortedLines.map(line => `<p>${line}</p>`).join("");
};
