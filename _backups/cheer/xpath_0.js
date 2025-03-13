import * as cheerio from 'cheerio';

/**
 * XPath를 CSS 선택자로 변환하는 간단한 함수
 */
const xpathToSelector = (xpath) => {
  console.log('@@@ Converting xpath:', xpath);

  // 상대 경로 XPath 처리 (.//td[3]/a 형식)
  if (xpath.startsWith('.//')) {
    return xpath
      .replace('.//td', 'td')
      .replace(/td\[(\d+)\]/g, 'td:nth-child($1)')
      .replace(/\/a$/, ' a')
      .replace(/\/span$/, ' span')
      .replace(/\/text\(\)$/, '');
  }

  // 단순 td 경로 처리 (td[3]/a 형식)
  if (xpath.startsWith('td')) {
    return xpath
      .replace(/td\[(\d+)\]/g, 'td:nth-child($1)')
      .replace(/\/a$/, ' a')
      .replace(/\/span$/, ' span')
      .replace(/\/text\(\)$/, '');
  }

  // ID를 포함한 절대 경로 XPath 처리
  let selector = xpath;

  // ID 처리
  selector = selector.replace(/\/\/\*\[@id="([^"]+)"\]/g, '#$1');

  // 테이블 행 처리
  selector = selector.replace(/\/tbody\/tr$/, ' tbody tr');

  // 나머지 경로 처리
  selector = selector
    .replace(/\/div\[(\d+)\]/g, ' > div:nth-child($1)')
    .replace(/\/div/g, ' > div')
    .replace(/\/table/g, ' > table')
    .replace(/\/tbody/g, ' > tbody')
    .replace(/\/tr/g, ' > tr')
    .replace(/\/td\[(\d+)\]/g, ' > td:nth-child($1)')
    .replace(/\/td/g, ' > td')
    .replace(/\/a/g, ' > a');

  console.log('@@@ Converted to selector:', selector);
  return selector;
};

/**
 * 요소에서 텍스트 또는 속성값 추출
 */
const getElementValue = (element, target, callback = null) => {
  if (!element) return null;

  let value = null;

  if (!target || target === 'text') {
    value = element.text().trim();
  } else if (target.startsWith('@')) {
    const attr = target.substring(1);
    value = element.attr(attr);
  } else if (target === 'href') {
    value = element.attr('href');
  }

  if (callback && typeof callback === 'string') {
    try {
      // eslint-disable-next-line no-eval
      const rst = value;
      value = eval(callback);
    } catch (e) {
      console.error('Callback execution error:', e);
    }
  }

  return value;
};

/**
 * 콜백 함수 실행
 */
const executeCallback = (callback, value) => {
  if (typeof callback === 'function') {
    return callback(value);
  }
  return value;
};

/**
 * HTML에서 지정된 XPath의 요소들 추출
 */
export const getElements = (html, xpath) => {
  const $ = cheerio.load(html);
  const selector = xpathToSelector(xpath);
  return $(selector)
    .toArray()
    .map((el) => $(el));
};

/**
 * HTML에서 데이터 추출
 */
export const getDict = (html, elements) => {
  const $ = cheerio.load(html);
  const result = {};

  for (const [key, config] of Object.entries(elements)) {
    let [xpath, target, callback] = Array.isArray(config) ? config : [config];

    const selector = xpathToSelector(xpath);
    const element = $(selector).first();

    if (element.length) {
      const value = getElementValue(element, target);
      result[key] = executeCallback(callback, value);
    }
  }

  return result;
};

/**
 * HTML에서 행 데이터 추출
 */
export const getRows = (html, rowXpath, elements, afterRow = null, afterRows = null) => {
  const rows = [];
  const $ = cheerio.load(html);

  const selector = xpathToSelector(rowXpath);
  console.log('@@@ Row selector:', selector);

  const nodes = $(selector).toArray();
  console.log(`@@@ Found ${nodes.length} rows`);

  for (const node of nodes) {
    const $row = $(node);
    const row = {};

    // 첫 번째 행의 HTML 출력 (디버깅용)
    if (nodes.indexOf(node) === 0) {
      console.log('@@@ First row HTML:', $row.html());
    }

    for (const [key, config] of Object.entries(elements)) {
      const [xpath, target, callback] = config;
      const selector = xpathToSelector(xpath);
      console.log(`@@@ Processing ${key} with selector:`, selector);

      let element;
      if (xpath.startsWith('.//')) {
        // 상대 경로인 경우
        element = $row.find(selector.replace(/^> /, ''));
      } else {
        // 절대 경로인 경우
        element = $row.find(selector);
      }

      if (element.length) {
        const value = getElementValue(element, target, callback);
        console.log(`@@@ Found value for ${key}:`, value);
        row[key] = executeCallback(callback, value);
      } else {
        console.log(`@@@ No element found for ${key} with selector:`, selector);
      }
    }

    if (afterRow) {
      afterRow(row);
    }
    rows.push(row);
  }

  if (afterRows) {
    afterRows(rows);
  }

  return rows;
};
