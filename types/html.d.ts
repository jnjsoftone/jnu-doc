declare const decodeHtml: (text: string) => string;
declare const encodeHtml: (text: string) => string;
declare const escapeRegExp: (value: string) => string;
declare const escapeMarkdown: (str: string) => string;
declare const escapeValue: (value: string) => string;
declare const unescapeValue: (value: string) => string;
declare const escapeDoubleQuotes: (str: string) => string;
declare const formatVariables: (variables: {
    [key: string]: string;
}) => string;
declare const makeUrlAbsolute: (element: any, attributeName: string, baseUrl: any) => void;
declare const formatDuration: (ms: number) => string;
export { encodeHtml, decodeHtml, escapeRegExp, escapeMarkdown, escapeValue, unescapeValue, escapeDoubleQuotes, formatVariables, makeUrlAbsolute, formatDuration, };
//# sourceMappingURL=html.d.ts.map