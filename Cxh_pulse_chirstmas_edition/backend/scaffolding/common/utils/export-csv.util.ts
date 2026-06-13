// import * as ExcelJs from 'exceljs';
// import { ColumnConfigDto } from './dto/utils.dto';

// export async function generateCsvBuffer(
//   data: any[],
//   sheetName: string,
//   columns: ColumnConfigDto[]
// ):
//     Promise<Buffer>
// {
//   const workbook = new ExcelJs.Workbook();
//   const worksheet = workbook.addWorksheet(sheetName);

//   worksheet.columns = columns;

//   data.forEach((item) => {
//     worksheet.addRow(item);
//   });

//   const buffer = await workbook.csv.writeBuffer();
//   return buffer as unknown as Buffer; 
// }