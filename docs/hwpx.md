/var/services/homes/jungsam/apps/npmjs/jnu-doc/src/hwpx.ts에서 readHwpxAsHTML의 결과에서 
<p><table> -> <table>, </table></p>  -> </table> 등과 같이 치환하고, <p></p> 와 같은 빈 줄도 삭제하는 후처리를 추가해주세요. 


===

/var/services/homes/jungsam/apps/npmjs/jnu-doc/src/hwpx.ts 의 함수들을  통합한 readHwpx 를 만들어주세요.

- readHwpx(source='<buffer>|<localPath>|<remoteUrl>|', output='plain|html|markdown') 형식으로 하고,
  - source 값의 형식에 따라 자동으로 buffer, localPath, remoteUrl을 인식하고,
  - output 의 값에 따라 출력 형식을 결정합니다. 