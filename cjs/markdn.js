"use strict";var e;Object.defineProperty(exports,"__esModule",{value:!0}),!function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(exports,{mdContent:function(){return u},mdFrontmatter:function(){return l},mdTitle:function(){return a}});const t=(e=require("turndown"))&&e.__esModule?e:{default:e},r=require("jnu-abc"),n=require("./html.js"),o={headingStyle:"atx",hr:"---",bulletListMarker:"-",codeBlockStyle:"fenced",emDelimiter:"*",preformattedCode:!0},i={figure:{filter:"figure",replacement:(e,t)=>{let r=t.querySelector("img"),n=t.querySelector("figcaption");if(!r)return e;let o=r.getAttribute("alt")||"",i=r.getAttribute("src")||"",a=n?n.textContent?.trim():"";return`![${o}](${i})

${a}

`}},codeBlock:{filter:["pre","code"],replacement:(e,t)=>{if("CODE"===t.nodeName&&"PRE"===t.parentNode.nodeName)return"";if("PRE"===t.nodeName){let e=t.querySelector("code"),r=e?.getAttribute("class")?.replace(/^language-/,"")||"",n=(e?.textContent||t.textContent||"").split("\n").map(e=>e.trimEnd()).join("\n").trim();return`\`\`\`${r}
${n}
\`\`\`

`}return`\`${e}\``}}},a=(e,t)=>(t||r.sanitizeName)(e),u=(e,r={})=>{let{config:n=o,rules:a=i}=r,u=new t.default(n);return Object.entries(a).forEach(([e,t])=>{u.addRule(e,t)}),u.turndown(e)},l=e=>{let t="---\n";for(let[r,o]of Object.entries(e))if(t+=`${r}:`,Array.isArray(o))t+="\n",o.forEach(e=>{t+=`  - "${(0,n.escapeDoubleQuotes)(String(e))}"
`});else switch(typeof o){case"number":let e=String(o).replace(/[^\d.-]/g,"");t+=e?` ${parseFloat(e)}
`:"\n";break;case"boolean":t+=` ${o}
`;break;case"string":""!==o.trim()?t+=` "${(0,n.escapeDoubleQuotes)(o)}"
`:t+="\n";break;default:t+=o?` "${(0,n.escapeDoubleQuotes)(String(o))}"
`:"\n"}return"---\n---"===(t+="---\n").trim()?"":t};