import{readFile as e}from"node:fs/promises";import{get as t}from"node:http";import{get as r}from"node:https";import{URL as n}from"node:url";import{parse as a}from"hwp.js";import o from"turndown";let i={0:"",10:"\n",13:"\n"},p=e=>{if("string"==typeof e.value)return e.value;if("number"==typeof e.value){let t=i[e.value];if("string"==typeof t)return t}return 0===e.type&&"number"==typeof e.value?String.fromCharCode(e.value):""},l=e=>e.content.map(p).join(""),s=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),f=e=>{let t=l(e);return`<p>${s(t)}</p>`},m=(e,a=0)=>new Promise((o,i)=>{let p=new n(e);("https:"===p.protocol?r:t)(p,t=>{let{statusCode:r=0,headers:l}=t;if(r>=300&&r<400&&l.location){if(a>=5){t.resume(),i(Error(`Too many redirects while fetching ${e}`));return}let r=new n(l.location,p).toString();t.destroy(),m(r,a+1).then(o).catch(i);return}if(r>=400){t.resume(),i(Error(`Request to ${e} failed with status code ${r}`));return}let s=[];t.on("data",e=>{s.push("string"==typeof e?Buffer.from(e):e)}),t.on("end",()=>o(Buffer.concat(s))),t.on("error",i)}).on("error",i)}),u=(e,t={})=>{let r=a(e,{...t.parseOptions??{},type:"buffer"}).sections.flatMap(e=>e.content).map(l).map(e=>e.replace(/\r\n/g,"\n").replace(/\r/g,"\n"));return!1===t.preserveParagraphBreaks?r.join(""):r.join("\n")},c=e=>e.replace(/<p>\s*<\/p>/g,"").replace(/<p><br><\/p>/g,"").replace(/<p>&nbsp;<\/p>/g,"").replace(/\n\s*\n\s*\n+/g,"\n\n").replace(/<p>[\s\u00a0]+<\/p>/g,""),d=(e,t={})=>{let r=a(e,{...t.parseOptions??{},type:"buffer"}).sections.flatMap(e=>e.content).map(f).join("\n");return r=c(r),`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HWP Document</title>
  <style>
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
${r}
</body>
</html>`},h=()=>new o({headingStyle:"atx",codeBlockStyle:"fenced",emDelimiter:"_"}),g=e=>{let t=h(),r=e.match(/<body>([\s\S]*?)<\/body>/),n=r?r[1]:e,a=t.turndown(n);return a.replace(/\n\s*\n\s*\n+/g,"\n\n").trim()},y=(e,t={})=>g(d(e,t)),w=async(t,r="plain",n={})=>{let a;if(Buffer.isBuffer(t))a=t;else if("string"==typeof t)a=t.trim().startsWith("http://")||t.trim().startsWith("https://")?await m(t.trim()):await e(t);else throw Error("Invalid source type. Must be a Buffer, file path string, or URL string.");switch(r){case"html":return d(a,n);case"markdown":return y(a,n);default:return u(a,n)}};export default w;export{w as readHwp};