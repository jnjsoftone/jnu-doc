import e from"turndown";import{sanitizeName as t}from"jnu-abc";import{escapeDoubleQuotes as r}from"./html.js";let n={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},o={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),n=t.querySelector("figcaption");if(!r)return e;let o=r.getAttribute("alt")||"",i=r.getAttribute("src")||"",a=n?n.textContent?.trim():"";return`![${o}](${i})

${a}

`}},codeBlock:{filter:["pre","code"],replacement:(e,t)=>{if("CODE"===t.nodeName&&"PRE"===t.parentNode.nodeName)return"";if("PRE"===t.nodeName){let e=t.querySelector("code"),r=e?.getAttribute("class")?.replace(/^language-/,"")||"",n=(e?.textContent||t.textContent||"").split("\n").map(e=>e.trimEnd()).join("\n").trim();return`\`\`\`${r}
${n}
\`\`\`

`}return`\`${e}\``}}},i=(e,r)=>(r||t)(e),a=(t,r={})=>{let{config:i=n,rules:a=o}=r,l=new e(i);return Object.entries(a).forEach(([e,t])=>{l.addRule(e,t)}),l.turndown(t)},l=e=>{let t="---\n";for(let[n,o]of Object.entries(e))if(t+=`${n}:`,Array.isArray(o))t+="\n",o.forEach(e=>{t+=`  - "${r(String(e))}"
`});else switch(typeof o){case"number":let e=String(o).replace(/[^\d.-]/g,"");t+=e?` ${parseFloat(e)}
`:"\n";break;case"boolean":t+=` ${o}
`;break;case"string":""!==o.trim()?t+=` "${r(o)}"
`:t+="\n";break;default:t+=o?` "${r(String(o))}"
`:"\n"}return"---\n---"===(t+="---\n").trim()?"":t};export{i as mdTitle,a as mdContent,l as mdFrontmatter};