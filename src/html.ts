// 현재 사용 중인 방식 (추가 설치 불필요)
import { unescape, escape } from 'querystring';

const encodeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/ /g, '&nbsp;')
    .replace(/\//g, '&#x2F;')
    .replace(/=/g, '&#x3D;');
};

const decodeHtml = (text: string): string => {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3D;/g, '=')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®');
};

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const escapeMarkdown = (str: string): string => {
  return str.replace(/([[\]])/g, '\\$1');
};

const escapeValue = (value: string): string => {
  return value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
};

const unescapeValue = (value: string): string => {
  return value.replace(/\\"/g, '"').replace(/\\n/g, '\n');
};

const escapeDoubleQuotes = (str: string): string => {
  return str.replace(/"/g, '\\"');
};

const formatVariables = (variables: { [key: string]: string }): string => {
  return Object.entries(variables)
    .map(([key, value]) => {
      const cleanKey = key.replace(/^{{|}}$/g, '');
      return `
        <div class="variable-item is-collapsed">
          <span class="variable-key" data-variable="${encodeHtml(key)}">${encodeHtml(cleanKey)}</span>
          <span class="variable-value">${encodeHtml(value)}</span>
          <span class="chevron-icon" aria-label="Expand">
            <i data-lucide="chevron-right"></i>
          </span>
        </div>
      `;
    })
    .join('');
};

const makeUrlAbsolute = (element: any, attributeName: string, baseUrl: any) => {
  const attributeValue = element.getAttribute(attributeName);
  if (attributeValue) {
    try {
      const resolvedBaseUrl = new URL(baseUrl.href);

      if (!resolvedBaseUrl.pathname.endsWith('/')) {
        resolvedBaseUrl.pathname = resolvedBaseUrl.pathname.substring(0, resolvedBaseUrl.pathname.lastIndexOf('/') + 1);
      }

      const url = new URL(attributeValue, resolvedBaseUrl);

      if (!['http:', 'https:'].includes(url.protocol)) {
        const parts = attributeValue.split('/');
        const firstSegment = parts[2];

        if (firstSegment && firstSegment.includes('.')) {
          const newUrl = `${baseUrl.protocol}//` + attributeValue.split('://')[1];
          element.setAttribute(attributeName, newUrl);
        } else {
          const path = parts.slice(3).join('/');
          const newUrl = new URL(path, resolvedBaseUrl.origin + resolvedBaseUrl.pathname).href;
          element.setAttribute(attributeName, newUrl);
        }
      } else {
        const newUrl = url.href;
        element.setAttribute(attributeName, newUrl);
      }
    } catch (error) {
      console.warn(`Failed to process URL: ${attributeValue}`, error);
      element.setAttribute(attributeName, attributeValue);
    }
  }
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
};

export {
  encodeHtml,
  decodeHtml,
  escapeRegExp,
  escapeMarkdown,
  escapeValue,
  unescapeValue,
  escapeDoubleQuotes,
  formatVariables,
  makeUrlAbsolute,
  formatDuration,
};
