var sd='';
function kochIsland (tu, n, s=1) {
   let i, m=45;
   for (i = 0; i < 3; i++) {
      tu.setMaterial(m*i);
      tu.newTrack(); 
      kochIslandSide(tu,n,s);
      tu.endTrack();
      tu.lt(90);  sd+='-';
   }
   tu.setMaterial(m*i);
   tu.newTrack(); 
   kochIslandSide(tu,n,s);
   tu.endTrack(); 
}

function kochIslandSide(tu, n, s) {
   if (n == 0) {
      tu.fd(s);
   } else {
      kochIslandSide(tu, n-1,s);
      tu.lt(90);   sd+='-';
      kochIslandSide(tu,n-1,s);
      tu.rt(90);   sd+='+';
      kochIslandSide(tu,n-1,s);
      tu.rt(90);
      kochIslandSide(tu,n-1,s);
      kochIslandSide(tu,n-1,s);
      tu.lt(90); sd+='-';
      kochIslandSide(tu,n-1,s);
      tu.lt(90); sd+='-';
      kochIslandSide(tu,n-1,s);
      tu.rt(90); sd+='+';
      kochIslandSide(tu,n-1,s);
   }
}
