import m from"js-yaml";import{loadFile as a,saveFile as o}from"jnu-abc";let e=o=>m.load(a(o)),l=a=>m.dump(a,{schema:m.JSON_SCHEMA,indent:4,noRefs:!0,sortKeys:!0,lineWidth:1/0}).trimEnd(),t=(m,a)=>{o(m,l(a))};export{e as loadYaml,l as dumpYaml,t as saveYaml};