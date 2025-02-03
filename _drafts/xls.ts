/**
 * A library for XLS(Excel) Utility Functions
 * https://www.npmjs.com/package/node-xlsx
 */
import xlsx from "node-xlsx";
// import { saveFile } from "jnj-lib-base";

// saveJsonPatients();
const getSheetNames = (worksheets: any[]) => {
  return worksheets.map((sheet) => sheet.name);
};

const loadXlsx = ({ path, sheetName }: { path: string; sheetName: string }) => {
  const worksheets = xlsx.parse(path);
  const sheet = worksheets.find((sheet: any) => sheet.name === sheetName);
  return sheet ? sheet.data ?? [] : [];
};

export { getSheetNames, loadXlsx };
// /**
//  * @param {string} path - saved file path
//  * @param {string} name - sheet name
//  * @param {any} data - ex) [[true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3']]
//  */
// const saveXlsx = (path: string, name: string, data: any) => {
//   return saveFile(path, xlsx.build([{ name, data }]));
// };
