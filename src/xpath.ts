// & IMPORT AREA
import * as xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// & INTERFACE AREA
// * settings = [{'key': '', 'xpath': '', 'attribute': ''}]
interface XpathSetting {
  key: string;
  xpath: string;
  attribute?: string;
  callback?: (value: any) => any;
}

// & FUNCTIONS AREA
/**
 * XPath를 네임스페이스 인식 XPath로 변환
 * HTML 문서는 XHTML 네임스페이스로 파싱되므로 local-name()을 사용해야 함
 * 또한 HTML 파서가 중간 노드를 추가할 수 있으므로 / 를 // 로 변환하여 유연하게 매칭
 */
const normalizeXpath = (xpathExpr: string): string => {
  // List of XPath keywords/attributes that should NOT be converted
  const keywords = ['not', 'and', 'or', 'text', 'id', 'class', 'href', 'target', 'src', 'alt', 'title', 'value', 'name'];

  let result = xpathExpr;

  // Step 1: Replace all single / with // for flexible descendant matching
  // But avoid converting inside predicates [@...]
  let current = '';
  let inPredicate = 0;

  for (let i = 0; i < result.length; i++) {
    const char = result[i];

    if (char === '[') {
      inPredicate++;
      current += char;
    } else if (char === ']') {
      inPredicate--;
      current += char;
    } else if (char === '/' && inPredicate === 0) {
      // Check if it's already // or followed by / or *
      if (result[i + 1] === '/' || result[i + 1] === '*') {
        current += char;
      } else {
        // Convert single / to //
        current += '//';
      }
    } else {
      current += char;
    }
  }

  result = current;

  // Step 2: Replace element names with *[local-name()="..."]
  // Match tag names: letters followed by optional alphanumeric
  result = result.replace(/(\/+)([a-zA-Z][a-zA-Z0-9]*)([\[@\/\]]|$)/g, (match, slashes, tagName, suffix) => {
    // Don't convert keywords
    if (keywords.includes(tagName)) {
      return match;
    }

    return `${slashes}*[local-name()="${tagName}"]${suffix}`;
  });

  return result;
};

/**
 * XPath로 단일 노드 선택
 */
const xpathSelect = (doc: Document, xpathExpr: string): Node | null => {
  // Normalize XPath for HTML documents with XHTML namespace
  const normalizedXpath = normalizeXpath(xpathExpr);

  try {
    const result = xpath.select(normalizedXpath, doc);
    if (Array.isArray(result) && result.length > 0) {
      return result[0] as Node;
    }
  } catch (e) {
    // If normalized XPath fails, try original
    try {
      const result = xpath.select(xpathExpr, doc);
      if (Array.isArray(result) && result.length > 0) {
        return result[0] as Node;
      }
    } catch (e2) {
      console.error(`XPath selection failed: ${e2}`);
    }
  }
  return null;
};

/**
 * XPath로 여러 노드 선택
 */
const xpathSelectAll = (doc: Document, xpathExpr: string): Node[] => {
  // Normalize XPath for HTML documents with XHTML namespace
  const normalizedXpath = normalizeXpath(xpathExpr);

  try {
    const result = xpath.select(normalizedXpath, doc);
    if (Array.isArray(result)) {
      return result as Node[];
    }
  } catch (e) {
    // If normalized XPath fails, try original
    try {
      const result = xpath.select(xpathExpr, doc);
      if (Array.isArray(result)) {
        return result as Node[];
      }
    } catch (e2) {
      console.error(`XPath selection failed: ${e2}`);
    }
  }
  return [];
};

/**
 * 노드에서 값 추출
 */
const _getValue = (node: Node | null, attribute?: string): any => {
  if (!node) return '';

  attribute ??= 'text';

  switch (attribute.toLowerCase()) {
    case 'text':
      return node.textContent?.trim() || '';

    case 'texts':
      const texts: any[] = [];
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          const text = node.childNodes[i].textContent?.trim();
          if (text && text.length > 0) {
            texts.push(text);
          }
        }
      }
      return texts;

    case 'innerhtml':
      if (node.nodeType === 1) { // Element node
        const serializer = new XMLSerializer();
        let html = '';
        if (node.childNodes) {
          for (let i = 0; i < node.childNodes.length; i++) {
            html += serializer.serializeToString(node.childNodes[i]);
          }
        }
        return html.trim();
      }
      return '';

    default:
      // attribute 값 추출
      if (node.nodeType === 1) { // Element node
        const element = node as Element;
        return element.getAttribute(attribute) || '';
      }
      return '';
  }
};

/**
 * XPath로 단일 값 추출
 */
const getValue = (doc: Document, xpathExpr: string, attribute?: string): any => {
  attribute ??= 'text';

  // XPath가 @attribute 형식이면 직접 추출
  if (xpathExpr.includes('/@')) {
    const result = xpath.select(xpathExpr, doc);
    if (Array.isArray(result) && result.length > 0) {
      const attr = result[0] as Attr;
      return attr.value || '';
    }
    return '';
  }

  // XPath가 /text() 형식이면 직접 추출
  if (xpathExpr.endsWith('/text()')) {
    const result = xpath.select(xpathExpr, doc);
    if (Array.isArray(result) && result.length > 0) {
      return (result[0] as Text).data?.trim() || '';
    }
    return '';
  }

  const node = xpathSelect(doc, xpathExpr);
  return _getValue(node, attribute);
};

/**
 * XPath로 여러 값 추출
 */
const getValues = (doc: Document, xpathExpr: string, attribute?: string): any[] => {
  attribute ??= 'text';

  // XPath가 @attribute 형식이면 직접 추출
  if (xpathExpr.includes('/@')) {
    const result = xpath.select(xpathExpr, doc);
    if (Array.isArray(result)) {
      return result.map((attr) => (attr as Attr).value || '').filter((v) => v);
    }
    return [];
  }

  // XPath가 /text() 형식이면 직접 추출
  if (xpathExpr.endsWith('/text()')) {
    const result = xpath.select(xpathExpr, doc);
    if (Array.isArray(result)) {
      return result.map((text) => (text as Text).data?.trim() || '').filter((v) => v);
    }
    return [];
  }

  const nodes = xpathSelectAll(doc, xpathExpr);
  const values: any[] = [];
  for (const node of nodes) {
    const value = _getValue(node, attribute);
    if (value) {
      values.push(value);
    }
  }
  return values;
};

/**
 * HTML 반환
 */
const getHtml = (doc: Document, xpathExpr?: string): string => {
  const serializer = new XMLSerializer();

  if (!xpathExpr) {
    return serializer.serializeToString(doc);
  }

  const node = xpathSelect(doc, xpathExpr);
  if (!node) return '';

  return serializer.serializeToString(node);
};

/**
 * XPath 설정으로 단일 객체 생성
 */
const dictFromRoot = (doc: Document, settings: XpathSetting[] = []): any => {
  const dict: any = {};
  for (const setting of settings) {
    if (!setting.xpath) {
      continue;
    }
    const value = getValue(doc, setting.xpath, setting.attribute);
    dict[setting.key] = setting.callback ? setting.callback(value) : value;
  }
  return dict;
};

/**
 * 여러 노드에서 객체 배열 생성
 */
const dictsFromRoots = (
  nodes: Node[],
  settings: XpathSetting[] = [],
  required: string[] = [],
  afterRow?: (row: any) => void,
  afterRows?: (rows: any[]) => void
): any[] => {
  const dicts: any[] = [];

  for (const node of nodes) {
    // 각 노드를 임시 문서로 만들어서 처리
    const doc = node.ownerDocument || (node as Document);

    const dict: any = {};
    for (const setting of settings) {
      if (!setting.xpath) {
        continue;
      }

      // 상대 경로 XPath 처리 (. 또는 .// 로 시작)
      let xpathExpr = setting.xpath;
      if (xpathExpr.startsWith('.//') || xpathExpr.startsWith('.')) {
        const result = xpath.select(xpathExpr, node);
        if (Array.isArray(result) && result.length > 0) {
          const targetNode = result[0] as Node;
          dict[setting.key] = setting.callback
            ? setting.callback(_getValue(targetNode, setting.attribute))
            : _getValue(targetNode, setting.attribute);
        } else {
          dict[setting.key] = '';
        }
      } else {
        const value = getValue(doc, xpathExpr, setting.attribute);
        dict[setting.key] = setting.callback ? setting.callback(value) : value;
      }
    }

    if (!dict) continue;

    let notPush = false;
    for (const key of required) {
      if (!dict[key]) {
        notPush = true;
        break;
      }
    }

    if (!notPush) {
      if (afterRow) {
        afterRow(dict);
      }
      dicts.push(dict);
    }
  }

  if (afterRows) {
    afterRows(dicts);
  }

  return dicts;
};

/**
 * 단일 요소 제거
 */
const removeElement = (doc: Document, xpathExpr: string): void => {
  const node = xpathSelect(doc, xpathExpr);
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
};

/**
 * 여러 요소 제거
 */
const removeElements = (doc: Document, xpathExpr: string): void => {
  const nodes = xpathSelectAll(doc, xpathExpr);
  for (const node of nodes) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
};

/**
 * 요소 추가
 */
const addElement = (
  doc: Document,
  srcHtml: string,
  dstXpath: string,
  location: 'before' | 'after' = 'after'
): void => {
  const targetNode = xpathSelect(doc, dstXpath);
  if (!targetNode || !targetNode.parentNode) return;

  // HTML 파싱
  const parser = new DOMParser();
  const fragment = parser.parseFromString(`<root>${srcHtml}</root>`, 'text/html');
  const rootElement = fragment.documentElement;

  if (!rootElement || !rootElement.childNodes) return;

  // 모든 자식 노드 추가
  for (let i = 0; i < rootElement.childNodes.length; i++) {
    const child = rootElement.childNodes[i];
    const importedNode = doc.importNode(child, true);

    if (location === 'before') {
      targetNode.parentNode.insertBefore(importedNode, targetNode);
    } else {
      if (targetNode.nextSibling) {
        targetNode.parentNode.insertBefore(importedNode, targetNode.nextSibling);
      } else {
        targetNode.parentNode.appendChild(importedNode);
      }
    }
  }
};

/**
 * 요소 찾기
 */
const findElements = (doc: Document, xpathExpr: string): Node[] => {
  return xpathSelectAll(doc, xpathExpr);
};

// & CLASS AREA
/**
 * Xpath 클래스
 * XPath를 사용하여 HTML/XML을 파싱하고 조작하는 클래스
 * Cheer 클래스와 동일한 API를 제공
 */
class Xpath {
  private doc: Document;

  constructor(source: string) {
    const parser = new DOMParser();
    // HTML로 파싱 시도, 실패하면 XML로 파싱
    try {
      this.doc = parser.parseFromString(source, 'text/html');
    } catch (e) {
      this.doc = parser.parseFromString(source, 'text/xml');
    }
  }

  /**
   * DOM 문서 반환
   */
  root() {
    return this.doc;
  }

  /**
   * XPath로 단일 값 추출
   * @param xpathExpr XPath 표현식
   * @param attribute 추출할 속성 (기본값: 'text')
   * @returns 추출된 값
   *
   * @example
   * const xp = new Xpath('<div><h1>Title</h1></div>');
   * xp.value('//h1'); // 'Title'
   * xp.value('//h1/@class'); // class 속성 값
   */
  value(xpathExpr: string, attribute?: string) {
    return getValue(this.doc, xpathExpr, attribute);
  }

  /**
   * XPath로 여러 값 추출
   * @param xpathExpr XPath 표현식
   * @param attribute 추출할 속성 (기본값: 'text')
   * @returns 추출된 값 배열
   *
   * @example
   * const xp = new Xpath('<ul><li>A</li><li>B</li></ul>');
   * xp.values('//li'); // ['A', 'B']
   */
  values(xpathExpr: string, attribute?: string) {
    return getValues(this.doc, xpathExpr, attribute);
  }

  /**
   * HTML 반환
   * @param xpathExpr XPath 표현식 (선택사항)
   * @returns HTML 문자열
   *
   * @example
   * const xp = new Xpath('<div><h1>Title</h1></div>');
   * xp.html('//h1'); // '<h1>Title</h1>'
   */
  html(xpathExpr?: string) {
    return getHtml(this.doc, xpathExpr);
  }

  /**
   * XPath 설정으로 객체 생성
   * @param settings XPath 설정 배열
   * @returns 객체
   *
   * @example
   * const xp = new Xpath('<div><h1>Title</h1><p>Content</p></div>');
   * xp.json([
   *   {key: 'title', xpath: '//h1'},
   *   {key: 'content', xpath: '//p'}
   * ]); // {title: 'Title', content: 'Content'}
   */
  json(settings: XpathSetting[] = []) {
    return dictFromRoot(this.doc, settings);
  }

  /**
   * 여러 요소에서 객체 배열 생성
   * @param elements 노드 배열
   * @param settings XPath 설정 배열
   * @param required 필수 키 배열
   * @param afterRow 각 행 처리 후 콜백
   * @param afterRows 모든 행 처리 후 콜백
   * @returns 객체 배열
   *
   * @example
   * const xp = new Xpath('<table><tr><td>A</td></tr><tr><td>B</td></tr></table>');
   * const rows = xp.find('//tr');
   * xp.jsons(rows, [{key: 'cell', xpath: './/td'}]); // [{cell: 'A'}, {cell: 'B'}]
   */
  jsons(
    elements: Node[],
    settings: XpathSetting[] = [],
    required: string[] = [],
    afterRow?: (row: any) => any,
    afterRows?: (rows: any[]) => any[]
  ) {
    return dictsFromRoots(elements, settings, required, afterRow, afterRows);
  }

  /**
   * 단일 요소 제거
   * @param xpathExpr XPath 표현식
   *
   * @example
   * const xp = new Xpath('<div><h1>Title</h1></div>');
   * xp.remove('//h1');
   */
  remove(xpathExpr: string) {
    removeElement(this.doc, xpathExpr);
  }

  /**
   * 여러 요소 제거
   * @param xpathExpr XPath 표현식
   *
   * @example
   * const xp = new Xpath('<div><p>A</p><p>B</p></div>');
   * xp.del('//p');
   */
  del(xpathExpr: string) {
    removeElements(this.doc, xpathExpr);
  }

  /**
   * 요소 추가
   * @param srcHtml 추가할 HTML
   * @param dstXpath 대상 XPath
   * @param location 추가 위치 ('before' | 'after')
   *
   * @example
   * const xp = new Xpath('<div><h1>Title</h1></div>');
   * xp.add('<p>New</p>', '//h1', 'after');
   */
  add(srcHtml: string, dstXpath: string, location: 'before' | 'after' = 'after') {
    addElement(this.doc, srcHtml, dstXpath, location);
  }

  /**
   * 요소 찾기
   * @param xpathExpr XPath 표현식
   * @returns 노드 배열
   *
   * @example
   * const xp = new Xpath('<div><p>A</p><p>B</p></div>');
   * const paragraphs = xp.find('//p'); // [Node, Node]
   */
  find(xpathExpr: string) {
    return findElements(this.doc, xpathExpr);
  }
}

// & EXPORT AREA
export { Xpath };
export type { XpathSetting };
