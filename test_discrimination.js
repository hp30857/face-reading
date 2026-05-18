// Test face analysis discrimination - landmark-calibrated version
function dist(p1,p2){return Math.sqrt((p1.x-p2.x)**2+(p1.y-p2.y)**2)}
function midX(pts){return pts.reduce((s,p)=>s+p.x,0)/pts.length}
function midY(pts){return pts.reduce((s,p)=>s+p.y,0)/pts.length}

const LM_RANGES = {
  fwhr:  { min: 1.10, max: 1.60, typical: [1.20, 1.45] },
  jwr:   { min: 0.75, max: 0.95, typical: [0.80, 0.90] },
  cjr:   { min: 0.68, max: 0.95, typical: [0.74, 0.88] },
  ear:   { min: 0.16, max: 0.38, typical: [0.22, 0.32] },
  icdr:  { min: 0.23, max: 0.37, typical: [0.27, 0.33] },
  nhr:   { min: 0.85, max: 1.80, typical: [1.10, 1.45] },
  mwr:   { min: 0.28, max: 0.52, typical: [0.35, 0.45] },
  fhr:   { min: 0.18, max: 0.42, typical: [0.25, 0.35] },
  clr:   { min: 0.14, max: 0.28, typical: [0.17, 0.24] },
  ber:   { min: 0.04, max: 0.14, typical: [0.06, 0.10] },
};

function scoreInRange(value, range, direction) {
  const { min, max, typical } = range;
  const tmid = (typical[0] + typical[1]) / 2;
  const clamped = Math.max(min, Math.min(max, value));
  if (direction === 'high') {
    if (clamped >= typical[1]) return 85 + Math.round(15 * Math.min(1, (clamped - typical[1]) / (max - typical[1])));
    if (clamped >= tmid) return 70 + Math.round(15 * (clamped - tmid) / (typical[1] - tmid));
    if (clamped >= typical[0]) return 50 + Math.round(20 * (clamped - typical[0]) / (tmid - typical[0]));
    return Math.round(50 * (clamped - min) / (typical[0] - min));
  } else if (direction === 'optimal') {
    if (clamped >= typical[0] && clamped <= typical[1]) return 80 + Math.round(15 * (1 - Math.abs(clamped - tmid) / (typical[1] - typical[0]) * 2));
    if (clamped > typical[1]) return 50 + Math.round(30 * (1 - (clamped - typical[1]) / (max - typical[1])));
    return 50 + Math.round(30 * (clamped - min) / (typical[0] - min));
  } else {
    if (clamped <= typical[0]) return 85 + Math.round(15 * (1 - (clamped - min) / (typical[0] - min)));
    if (clamped <= tmid) return 70 + Math.round(15 * (1 - (clamped - typical[0]) / (tmid - typical[0])));
    if (clamped <= typical[1]) return 50 + Math.round(20 * (1 - (clamped - tmid) / (typical[1] - tmid)));
    return Math.round(50 * (1 - (clamped - typical[1]) / (max - typical[1])));
  }
}

function analyze(landmarks){
  const lm=landmarks.positions, R=LM_RANGES;
  const fw=dist(lm[2],lm[14]), jw=dist(lm[4],lm[12]), fh=dist(lm[8],lm[27]);
  const fwhr=fw/fh, jwr=jw/fw;
  const cw=dist(lm[5],lm[11]), cjr=cw/jw;
  const fw_t=dist(lm[17],lm[26]);

  const lew=dist(lm[36],lm[39]), rew=dist(lm[42],lm[45]), aew=(lew+rew)/2;
  const leh=(dist(lm[37],lm[41])+dist(lm[38],lm[40]))/2, reh=(dist(lm[43],lm[47])+dist(lm[44],lm[46]))/2, aeh=(leh+reh)/2;
  const ear=aeh/aew, icd=dist(lm[39],lm[42]), icdr=icd/fw;

  const ltilt=(lm[39].y-lm[36].y)/Math.max(1,lm[39].x-lm[36].x);
  const rtilt=(lm[45].y-lm[42].y)/Math.max(1,lm[45].x-lm[42].x);
  const tiltDeg=Math.atan((ltilt+rtilt)/2)*180/Math.PI;

  const nbl=dist(lm[27],lm[30]), nw=dist(lm[31],lm[35]), nhr=nbl/nw;
  const mw=dist(lm[48],lm[54]), mwr=mw/fw;

  const bt=Math.min(...lm.slice(17,27).map(p=>p.y)), ft=Math.min(...lm.map(p=>p.y));
  const fhh=Math.max(5,bt-ft+8), fhr=fhh/fh;

  const browMidY_l=midY(lm.slice(17,22)), eyeMidY_l=midY(lm.slice(36,42));
  const ber=Math.abs(browMidY_l-eyeMidY_l)/fh;

  const cl=dist(lm[8],lm[57]), clr=cl/fh;

  const leftEC={x:midX(lm.slice(36,42)),y:midY(lm.slice(36,42))};
  const rightEC={x:midX(lm.slice(42,48)),y:midY(lm.slice(42,48))};
  const faceC={x:midX([lm[27],lm[30],lm[33]]),y:midY([lm[27],lm[30],lm[33]])};
  const eyeSym=1-Math.abs(dist(leftEC,faceC)-dist(rightEC,faceC))/Math.max(1,Math.max(dist(leftEC,faceC),dist(rightEC,faceC)));
  const jawSym=1-Math.abs(dist(lm[3],lm[15])-dist(lm[13],lm[15]))/Math.max(1,fw);
  const symScore=Math.round((eyeSym*0.6+jawSym*0.4)*100);

  const gRef=1.618;
  const gChecks=[fw/fh,fw/nw,icd/aew,fh/cl];
  const goldenScore=Math.round(gChecks.reduce((s,v)=>s+Math.max(0,100-Math.abs(v-gRef)/gRef*100),0)/gChecks.length);

  // Face shape - landmark calibrated
  const shapeScores={};
  shapeScores.round=Math.round(50+50*Math.max(0,Math.min(1,(fwhr-R.fwhr.typical[0])/(R.fwhr.max-R.fwhr.typical[0]))));
  shapeScores.square=Math.round(30+70*Math.max(0,Math.min(1,(jwr-R.jwr.typical[0])/(R.jwr.max-R.jwr.typical[0]))));
  shapeScores.heart=Math.round(30+70*Math.max(0,Math.min(1,(R.cjr.typical[0]-cjr)/(R.cjr.typical[0]-R.cjr.min)))*Math.max(0,Math.min(1,fw_t/Math.max(1,jw))));
  const fwhrDev=Math.abs(fwhr-(R.fwhr.typical[0]+R.fwhr.typical[1])/2);
  const jwrDev=Math.abs(jwr-(R.jwr.typical[0]+R.jwr.typical[1])/2);
  shapeScores.oval=Math.round(100-60*(fwhrDev/(R.fwhr.max-R.fwhr.min))-40*(jwrDev/(R.jwr.max-R.jwr.min)));
  shapeScores.oval=Math.max(30,Math.min(95,shapeScores.oval));
  shapeScores.long=Math.round(30+70*Math.max(0,Math.min(1,(R.fwhr.typical[0]-fwhr)/(R.fwhr.typical[0]-R.fwhr.min))));

  const shapeNames={round:'圆脸',square:'方脸',heart:'瓜子脸',oval:'鹅蛋脸',long:'长脸'};
  const best=Object.entries(shapeScores).sort((a,b)=>b[1]-a[1])[0];

  return {
    faceShape:{name:shapeNames[best[0]],score:Math.round(best[1])},
    forehead:{score:scoreInRange(fhr,R.fhr,'high'),ratio:fhr},
    eyebrows:{score:scoreInRange(ber,R.ber,'optimal'),ratio:ber},
    eyes:{score:Math.round((scoreInRange(ear,R.ear,'high')+scoreInRange(icdr,R.icdr,'optimal'))/2),ear,icdr,tilt:tiltDeg},
    nose:{score:scoreInRange(nhr,R.nhr,'high'),ratio:nhr},
    mouth:{score:scoreInRange(mwr,R.mwr,'optimal'),ratio:mwr},
    chin:{score:scoreInRange(cjr,R.cjr,'optimal'),jawRatio:cjr},
    cheekbones:{score:scoreInRange(fwhr,R.fwhr,'optimal'),ratio:fwhr},
    symmetry:{score:Math.min(98,symScore)},
    golden:{score:Math.min(98,goldenScore)},
    raw:{fwhr,jwr,ear,icdr,nhr,mwr,cjr,clr,fhr,ber,tiltDeg}
  };
}

// Generate faces with REALISTIC landmark ratios
function makeFace(fwhrTarget, jwrTarget, earTarget, nhrTarget, mwrTarget, cjrTarget) {
  const fw = 200;
  const fh = Math.round(fw / fwhrTarget);  // fwhr = fw/fh => fh = fw/fwhr
  const jw = Math.round(fw * jwrTarget);
  const cw = Math.round(jw * cjrTarget);

  const lm = [];

  // Jaw line (0-16): creates the face outline
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    // Interpolate: top narrow (forehead) -> wide (cheeks) -> narrow (chin)
    let widthRatio;
    if (t < 0.25) widthRatio = 0.85 + t / 0.25 * 0.10;        // forehead -> cheeks
    else if (t < 0.5) widthRatio = 0.95 + (t - 0.25) / 0.25 * 0.05; // cheeks max
    else widthRatio = 1.0 - (t - 0.5) / 0.5 * 0.65;           // cheeks -> chin

    const x = 100 + Math.sin(t * Math.PI - 0.1) * fw * widthRatio * 0.55;
    const y = 30 + t * fh * 0.72;
    lm.push({ x, y });
  }

  // Adjust lm[2] and lm[14] to match fw
  lm[2].x = 100 - fw / 2; lm[14].x = 100 + fw / 2;
  // Adjust lm[4] and lm[12] to match jw
  lm[4].x = 100 - jw / 2; lm[12].x = 100 + jw / 2;
  // Adjust lm[5] and lm[11] to match cw
  lm[5].x = 100 - cw / 2; lm[11].x = 100 + cw / 2;

  // Eyebrows (17-26)
  const browY = 30 + fh * 0.18;
  for (let i = 0; i < 5; i++) lm.push({ x: 70 + i * 15, y: browY + i * 2 });
  for (let i = 0; i < 5; i++) lm.push({ x: 130 + i * 15, y: browY + i * 2 });

  // Nose bridge (27-30)
  const noseTop = 30 + fh * 0.25;
  const noseBot = 30 + fh * 0.58;
  lm.push({ x: 100, y: noseTop });
  lm.push({ x: 100, y: noseTop + (noseBot - noseTop) * 0.33 });
  lm.push({ x: 100, y: noseTop + (noseBot - noseTop) * 0.66 });
  lm.push({ x: 100, y: noseBot });

  // Nose bottom (31-35): nhr = nbl/nw => nw = nbl/nhr
  const nbl = dist(lm[27], lm[30]);
  const nw = Math.round(nbl / nhrTarget);
  const alarY = noseBot + 5;
  lm.push({ x: 100 - nw / 2, y: alarY });
  lm.push({ x: 100 - nw / 4, y: alarY + 2 });
  lm.push({ x: 100, y: alarY + 3 });
  lm.push({ x: 100 + nw / 4, y: alarY + 2 });
  lm.push({ x: 100 + nw / 2, y: alarY });

  // Eyes (36-47): ear = aeh/aew => aeh = ear * aew
  const eyeY = 30 + fh * 0.32;
  const aewTarget = fw * 0.14;  // eye width ~14% of face width
  const aehTarget = aewTarget * earTarget;
  const tiltRad = Math.atan((5) * Math.PI / 180) * aewTarget / 2;

  // Right eye (36-41)
  lm.push({ x: 100 - aewTarget * 1.5, y: eyeY });                          // 36 outer
  lm.push({ x: 100 - aewTarget * 1.25, y: eyeY - aehTarget / 2 - tiltRad }); // 37 top-outer
  lm.push({ x: 100 - aewTarget * 0.75, y: eyeY - aehTarget / 2 });          // 38 top-inner
  lm.push({ x: 100 - aewTarget * 0.5, y: eyeY });                           // 39 inner
  lm.push({ x: 100 - aewTarget * 0.75, y: eyeY + aehTarget / 2 });          // 40 bottom-inner
  lm.push({ x: 100 - aewTarget * 1.25, y: eyeY + aehTarget / 2 - tiltRad });// 41 bottom-outer

  // Left eye (42-47)
  lm.push({ x: 100 + aewTarget * 0.5, y: eyeY });                           // 42 inner
  lm.push({ x: 100 + aewTarget * 0.75, y: eyeY - aehTarget / 2 });          // 43 top-inner
  lm.push({ x: 100 + aewTarget * 1.25, y: eyeY - aehTarget / 2 });          // 44 top-outer
  lm.push({ x: 100 + aewTarget * 1.5, y: eyeY });                           // 45 outer
  lm.push({ x: 100 + aewTarget * 1.25, y: eyeY + aehTarget / 2 });          // 46 bottom-outer
  lm.push({ x: 100 + aewTarget * 0.75, y: eyeY + aehTarget / 2 });          // 47 bottom-inner

  // Set lm[39] and lm[42] inner canthus for icd
  const icdTarget = fw * 0.30;
  lm[39].x = 100 - icdTarget / 2;
  lm[42].x = 100 + icdTarget / 2;

  // Mouth (48-67): mwr = mw/fw => mw = mwr * fw
  const mwTarget = Math.round(fw * mwrTarget);
  const mouthY = 30 + fh * 0.72;
  for (let i = 0; i < 20; i++) {
    const t = i / 19;
    lm.push({ x: 100 - mwTarget / 2 + t * mwTarget, y: mouthY + Math.sin(t * Math.PI) * 6 });
  }

  // Set lm[8] (chin bottom) for face height
  lm[8].y = 30 + fh * 0.72;
  lm[8].x = 100;

  return { positions: lm };
}

const faces = [
  { name: '圆脸(宽)',   data: makeFace(1.42, 0.87, 0.26, 1.15, 0.42, 0.85) },
  { name: '方脸(刚毅)', data: makeFace(1.35, 0.92, 0.23, 1.30, 0.40, 0.90) },
  { name: '瓜子脸(秀)', data: makeFace(1.28, 0.82, 0.33, 1.50, 0.36, 0.72) },
  { name: '鹅蛋脸(标)', data: makeFace(1.32, 0.84, 0.29, 1.35, 0.40, 0.80) },
  { name: '长脸(窄)',   data: makeFace(1.18, 0.80, 0.20, 1.05, 0.33, 0.78) },
];

console.log('FACE DISCRIMINATION TEST (landmark-calibrated)');
console.log('='.repeat(65));

const results = faces.map(f => {
  const a = analyze(f.data);
  const overall = Math.round(
    a.faceShape.score*0.15 + a.forehead.score*0.10 + a.eyes.score*0.15 +
    a.nose.score*0.15 + a.mouth.score*0.10 + a.chin.score*0.10 +
    a.cheekbones.score*0.07 + a.symmetry.score*0.05 + a.golden.score*0.03
  );
  return { name: f.name, ...a, overall };
});

const shapeNames = results.map(r => r.faceShape.name);
console.log('\nUnique face shapes:', [...new Set(shapeNames)]);
console.log('Shape variety:', new Set(shapeNames).size, '/', faces.length);

console.log('\n--- Per Face ---');
results.forEach(r => {
  console.log('\n[' + r.name + '] Overall: ' + r.overall);
  console.log('  Shape: ' + r.faceShape.name + ' (' + r.faceShape.score + ')');
  console.log('  Forehead: ' + r.forehead.score + ' | Eyes: ' + r.eyes.score + ' | Nose: ' + r.nose.score);
  console.log('  Mouth: ' + r.mouth.score + ' | Chin: ' + r.chin.score + ' | Cheek: ' + r.cheekbones.score);
  console.log('  Symmetry: ' + r.symmetry.score + ' | Golden: ' + r.golden.score);
  console.log('  Raw: fwhr=' + r.raw.fwhr.toFixed(2) + ' jwr=' + r.raw.jwr.toFixed(2) + ' cjr=' + r.raw.cjr.toFixed(2) + ' ear=' + r.raw.ear.toFixed(2) + ' nhr=' + r.raw.nhr.toFixed(2) + ' mwr=' + r.raw.mwr.toFixed(2));
});

const allOverall = results.map(r => r.overall);
const allEyes = results.map(r => r.eyes.score);
const allNose = results.map(r => r.nose.score);
const allShape = results.map(r => r.faceShape.score);

console.log('\n--- Score Spread ---');
console.log('Overall: range=' + (Math.max(...allOverall) - Math.min(...allOverall)) + ' values=' + allOverall.join(','));
console.log('Eyes:    range=' + (Math.max(...allEyes) - Math.min(...allEyes)) + ' values=' + allEyes.join(','));
console.log('Nose:    range=' + (Math.max(...allNose) - Math.min(...allNose)) + ' values=' + allNose.join(','));
console.log('Shape:   range=' + (Math.max(...allShape) - Math.min(...allShape)) + ' values=' + allShape.join(','));

const uniqShapes = new Set(shapeNames).size;
const avgSpread = (Math.max(...allOverall)-Math.min(...allOverall) + Math.max(...allEyes)-Math.min(...allEyes) + Math.max(...allNose)-Math.min(...allNose)) / 3;

if (uniqShapes >= 3 && avgSpread > 12) {
  console.log('\nRESULT: ✓ GOOD discrimination - ' + uniqShapes + ' face shapes, avg spread ' + avgSpread.toFixed(0) + 'pts');
} else if (uniqShapes >= 2 && avgSpread > 6) {
  console.log('\nRESULT: ~ MODERATE - ' + uniqShapes + ' face shapes, avg spread ' + avgSpread.toFixed(0) + 'pts');
} else {
  console.log('\nRESULT: ✗ POOR - ' + uniqShapes + ' face shapes, avg spread ' + avgSpread.toFixed(0) + 'pts');
}
