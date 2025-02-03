import ini from 'ini';
import { loadFile, saveFile } from 'jnu-abc';

const loadIni = (path: string) => {
  return ini.parse(loadFile(path));
};

const saveIni = (path: string, data: any) => {
  return saveFile(path, ini.stringify(data));
};

export { loadIni, saveIni };
