import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from "exceljs";

export function safeImportModule<T = any>(relativePath: string): T | null {
  const fullPath = path.join(__dirname, relativePath);
  const tsPath = fullPath + '.ts';
  const jsPath = fullPath + '.js';

  if (fs.existsSync(jsPath) || fs.existsSync(tsPath)) {
    const mod = require(fullPath);
    const moduleClass =
      mod.default || Object.values(mod).find((v) => typeof v === 'function');
    if (!moduleClass) {
      console.warn(`No valid module class found in ${relativePath}`);
      return null;
    }
    return moduleClass as T;
  }

  console.warn(`Skipping missing module: ${relativePath}`);
  return null;
}

export function safeLoadEntities(relativeDir: string): any[] {
  const fullDir = path.join(__dirname, relativeDir);
  if (!fs.existsSync(fullDir)) return [];

  const files = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith('.entity.ts') || f.endsWith('.entity.js'));

  return files
    .map((file) => {
      const fullPath = path.join(fullDir, file);
      try {
        const mod = require(fullPath);
        return mod.default || Object.values(mod)[0];
      } catch (err) {
        console.warn(`Could not import entity from ${file}:`, err.message);
        return null;
      }
    })
    .filter(Boolean);
}


export function toUTC(dateInput: string | Date): string {
  const date = dateInput instanceof Date
    ? dateInput
    : new Date(dateInput);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }

  return date.toISOString();
}

function getExcelColumnName(colIndex: number): string {
  let name = "";
  while (colIndex > 0) {
    const remainder = (colIndex - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return name;
}


export async function generateExcel(workbook: ExcelJS.Workbook, data: any[], headerText: string, moduleName: string, title: string[], header: string[], showZeroBalance: boolean = true) {
  const sheet = workbook.addWorksheet(moduleName);
  const font = { name: "Inter", size: 11 };
  const lastColumn = getExcelColumnName(header.length);
  const dynamicMergedCell = `A1:${lastColumn}2`;

  sheet.mergeCells(dynamicMergedCell);

  const titleCell = sheet.getCell("A1");

  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF" },
  };

  titleCell.value = headerText;
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  titleCell.font = {
    name: "Inter",
    bold: true,
    color: { argb: "#000000" },
    size: 14,
  };

  const lineCount = headerText.split("\n").length;
  const heightPerLine = 20;
  const totalHeight = lineCount * heightPerLine;

  sheet.getRow(1).height = totalHeight / 2; // first merged row
  sheet.getRow(2).height = totalHeight / 2 // second merged row


  sheet.addRow(header);

  const headerRow = sheet.getRow(3);
  headerRow.font = { bold: true };

  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  data.forEach((item) => {
    if (!showZeroBalance) {
      const balance =
        item.taxBalance ?? item.accountBalance ?? item.contactBalance;

      if (balance !== null && balance !== undefined && balance !== "") {
        const num = Number(balance);
        if (!isNaN(num) && Math.floor(num) === 0) {
          return;
        }
      }
    }
    sheet.addRow(
      title.map((f) => {
        const value = (item as any)[f];

        if (
          typeof value === "string" &&
          value.trim() !== "" &&
          !isNaN(Number(value))
        ) {
          return Number(value);
        }

        if (value === true || value === "true") return "Yes";
        if (value === false || value === "false") return "No";

        if (f === "group") {
          return value?.groupName ?? "";
        }

        if (f === "parentAccount") {
          return value?.accountName ?? "";
        }

        if (value === null || value === undefined) return "";

        return value;
      })
    );
  });


  const totalRows = sheet.rowCount;
  const totalCols = sheet.columnCount;

  for (let row = 3; row <= totalRows; row++) {
    const rowData = sheet.getRow(row);

    for (let col = 1; col <= totalCols; col++) {
      const cell = rowData.getCell(col); // force cell creation

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.font = font;
    }

    const cellValues: string[] = [];

    rowData.eachCell((cell) => {
      cellValues.push(String(cell.value ?? ""));
    });

    rowData.height =
      cellValues
        .map((v) => (v ? v.split("\n").length : 1))
        .reduce((a, b) => Math.max(a, b), 1) * 15;
  }

  sheet.columns.forEach((column) => {
    let maxLength = 20;
    const maxWidth = 30;

    column.eachCell?.((cell) => {
      if (cell.isMerged) return;

      const len = cell.value ? cell.value.toString().trim().length : 10;
      maxLength = Math.min(Math.max(maxLength, len), maxWidth);

      if (cell.address !== "A1") {
        cell.font = font;
      }
    });

    column.width = maxLength + 2;
  });

  return sheet;
}

export async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  if (!imageUrl) throw new Error("No image URL provided");
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateExcelWithHeaderImage(
  workbook: ExcelJS.Workbook,
  data: any[],
  headerText: string,
  moduleName: string,
  title: string[],
  header: string[],
  headerUrl: string
) {
  const sheet = workbook.addWorksheet(moduleName);
  const font = { name: "Inter", size: 11 };
  const lastColumn = title.length;
  if (headerUrl) {
    const imageBuffer = await fetchImageAsBuffer(headerUrl);

    const imageId = workbook.addImage({
      buffer: imageBuffer as any,
      extension: "jpeg",
    });

    sheet.getRow(1).height = 50;
    sheet.getRow(2).height = 50;

    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 } as any,
      br: { col: lastColumn, row: 2 } as any,
      editAs: "oneCell",
    });
  }

  sheet.getRow(3).height = 40;
  sheet.getRow(4).height = 40;

  const headerMerge = `A3:${getExcelColumnName(lastColumn)}4`;
  sheet.mergeCells(headerMerge);

  const headerCell = sheet.getCell("A3");
  headerCell.value = headerText;
  headerCell.font = { name: "Inter", size: 14, bold: true };
  headerCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  sheet.addRow([]); // row 5
  sheet.addRow(header); // row 6

  const headerRow = sheet.getRow(6);
  headerRow.font = { bold: true };

  sheet.views = [{ state: "frozen", ySplit: 6 }];

  data.forEach((item) => {
    sheet.addRow(
      title.map((f) => {
        const value = item[f];
        if (value === true) return "Yes";
        if (value === false) return "No";
        return value ?? "";
      })
    );
  });

  for (let r = 6; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.font = font;
    });
  }

  sheet.columns.forEach((col) => {
    col.width = 25;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export const getTemplatePath = (filename: string): string => {
  const basePath = process.env.TEMPLATE_BASE_PATH;
  if (!filename) throw new Error("Template path missing");

  if (!basePath) {
    throw new Error("TEMPLATE_BASE_PATH not defined in env");
  }

  return path.join(basePath, "src", "utils", filename);
};

export const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export const getNumberFormat = (
  commaSeparation: "US" | "IN",
  decimalPlace: boolean,
  currency: string
) => {
  const decimals = decimalPlace ? ".00" : "";
  return commaSeparation === "IN"
    ? `[$-en-IN]${currency}#,##,##0${decimals}`
    : `${currency}#,##0${decimals}`;
};

export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${datePart}, ${timePart}`;
}