/**
 * A library for Yaml Utility Functions
 *
 */

import yaml from 'js-yaml';
import { loadFile, saveFile } from 'jnu-abc';
// import { ENV } from "./env.js";

// const { SETTINGS_PATH } = ENV

/**
 * Load Yaml
 *
 * @param path - string, './filename.ext'
 *
 */
const loadYaml = (path: string) => {
  return yaml.load(loadFile(path));
};

/**
 * Dump Yaml
 *
 * @param path - string, './filename.ext'
 *
 */
const dumpYaml = (data: any) => {
  return yaml
    .dump(data, {
      schema: yaml.JSON_SCHEMA,
      indent: 4,
      noRefs: true,
      sortKeys: true,
      lineWidth: Infinity,
    })
    .trimEnd();
};

/**
 * Save Yaml
 *
 * @param path - string, './filename.ext'
 * @param data
 *
 */
const saveYaml = (path: string, data: any) => {
  saveFile(path, dumpYaml(data));
};

export { loadYaml, dumpYaml, saveYaml };
// // & TEST
// console.log(loadYaml('C:/JnJ-soft/Developments/_Settings/_temp/_config/database/database_conn.yaml'));
// console.log(dumpYaml({'a': 1, 'b': {'c': [1,2,3], 'd': {'x': 5, 'y': 6}}}));
