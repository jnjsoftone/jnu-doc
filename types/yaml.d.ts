/**
 * A library for Yaml Utility Functions
 *
 */
/**
 * Load Yaml
 *
 * @param path - string, './filename.ext'
 *
 */
declare const loadYaml: (path: string) => any;
/**
 * Dump Yaml
 *
 * @param path - string, './filename.ext'
 *
 */
declare const dumpYaml: (data: any) => any;
/**
 * Save Yaml
 *
 * @param path - string, './filename.ext'
 * @param data
 *
 */
declare const saveYaml: (path: string, data: any) => void;
export { loadYaml, dumpYaml, saveYaml };
//# sourceMappingURL=yaml.d.ts.map