interface XpathSetting {
    key: string;
    xpath: string;
    attribute?: string;
    callback?: (value: any) => any;
}
/**
 * Xpath 클래스
 * XPath를 사용하여 HTML/XML을 파싱하고 조작하는 클래스
 * Cheer 클래스와 동일한 API를 제공
 */
declare class Xpath {
    private doc;
    constructor(source: string);
    /**
     * DOM 문서 반환
     */
    root(): Document;
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
    value(xpathExpr: string, attribute?: string): any;
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
    values(xpathExpr: string, attribute?: string): any[];
    /**
     * HTML 반환
     * @param xpathExpr XPath 표현식 (선택사항)
     * @returns HTML 문자열
     *
     * @example
     * const xp = new Xpath('<div><h1>Title</h1></div>');
     * xp.html('//h1'); // '<h1>Title</h1>'
     */
    html(xpathExpr?: string): string;
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
    json(settings?: XpathSetting[]): any;
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
    jsons(elements: Node[], settings?: XpathSetting[], required?: string[], afterRow?: (row: any) => any, afterRows?: (rows: any[]) => any[]): any[];
    /**
     * 단일 요소 제거
     * @param xpathExpr XPath 표현식
     *
     * @example
     * const xp = new Xpath('<div><h1>Title</h1></div>');
     * xp.remove('//h1');
     */
    remove(xpathExpr: string): void;
    /**
     * 여러 요소 제거
     * @param xpathExpr XPath 표현식
     *
     * @example
     * const xp = new Xpath('<div><p>A</p><p>B</p></div>');
     * xp.del('//p');
     */
    del(xpathExpr: string): void;
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
    add(srcHtml: string, dstXpath: string, location?: 'before' | 'after'): void;
    /**
     * 요소 찾기
     * @param xpathExpr XPath 표현식
     * @returns 노드 배열
     *
     * @example
     * const xp = new Xpath('<div><p>A</p><p>B</p></div>');
     * const paragraphs = xp.find('//p'); // [Node, Node]
     */
    find(xpathExpr: string): Node[];
}
export { Xpath };
export type { XpathSetting };
//# sourceMappingURL=xpath.d.ts.map