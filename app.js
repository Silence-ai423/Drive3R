"use strict";
function initTabs(selector, activate) {
  const tabs = [...document.querySelectorAll(selector)];
  const select = tab => {
    tabs.forEach(t => { const selected = t === tab; t.setAttribute("aria-selected", String(selected)); t.tabIndex = selected ? 0 : -1; });
    activate(tab);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].focus(); select(tabs[next]);
    });
  });
}
const datasets = {
  nuscenes: {
    label: "nuScenes", protocol: "15 frames · full camera views", title: "Dense geometry & ego-motion", takeaway: "Drive3R leads five of six reported nuScenes metrics. DVGT has the highest AUC@30.",
    rows: [
      ["Offline", "VGGT*", .1967,.6835,.8315,1.5516,85.47,.9151],
      ["Offline", "π³x", .2651,.6672,.9515,.7946,78.88,3.1063],
      ["Offline", "DA3-Nested", .2261,.6778,.8521,.9007,86.86,1.1709],
      ["Offline", "DVGT", .1397,.8211,.6158,.6013,88.64,1.1012],
      ["Per-frame streaming", "StreamVGGT*", .2623,.4928,1.1090,2.4368,80.98,1.5748],
      ["Per-frame streaming", "LongStream", .3026,.4517,1.1155,.9305,39.29,1.8030],
      ["Per-frame streaming", "DVGT-2", .1806,.7285,.6750,.6230,85.08,1.5812],
      ["Block-wise streaming", "Drive3R", .1081,.9077,.5344,.5374,86.92,.9092]
    ]
  },
  waymo: {
    label: "Waymo", protocol: "15 frames · full camera views", title: "Dense geometry & ego-motion", takeaway: "Drive3R leads the four depth / point-cloud metrics and AUC@30. VGGT has the lowest ATE; Drive3R does not lead that metric.",
    rows: [
      ["Offline", "VGGT*", .2386,.7657,.9033,1.4851,86.78,3.2108],
      ["Offline", "π³x", .5005,.3273,.7513,1.5304,77.04,6.9732],
      ["Offline", "DA3-Nested", .3970,.3629,1.0020,2.0973,79.20,3.3885],
      ["Offline", "DVGT", .4698,.4183,.9653,1.6218,85.58,3.6566],
      ["Per-frame streaming", "StreamVGGT*", .3253,.5616,1.0984,.9806,82.72,4.9199],
      ["Per-frame streaming", "LongStream", .2065,.7849,.9836,4.7566,40.88,9.7395],
      ["Per-frame streaming", "DVGT-2", .4356,.4774,1.4894,.9539,84.73,3.8579],
      ["Block-wise streaming", "Drive3R", .1947,.8429,.5941,.5894,86.84,3.9387]
    ]
  },
  kitti: {
    label: "KITTI", protocol: "Stereo · 2 Hz · Sim(3)-aligned ATE ↓", title: "Long-sequence ego-motion", takeaway: "Drive3R reports the lowest average ATE across all 11 complete sequences. Individual-sequence leaders vary by method.",
    rows: [
      ["Per-frame streaming", "CUT3R",181.0,692.4,271.6,51.3,16.2,147.5,133.3,84.8,256.1,155.6,63.0,186.6],
      ["Per-frame streaming", "TTT3R",181.1,68.6,243.2,16.2,6.3,138.8,127.5,64.9,126.3,110.4,43.3,102.4],
      ["Per-frame streaming", "DVGT-2",148.4,29.6,252.9,15.6,2.8,59.2,12.1,5.2,181.2,105.5,18.2,75.5],
      ["Per-frame streaming", "StreamVGGT",null,680.6,null,154.2,79.8,null,123.4,79.3,null,208.0,157.2,211.8],
      ["Chunk-then-align", "DA3-Streaming",125.2,113.2,215.8,6.2,.8,124.7,50.5,35.1,100.2,127.1,46.1,85.9],
      ["Chunk-then-align", "VGGT-Long",181.6,50.1,189.9,4.9,1.7,43.3,33.3,21.8,96.8,120.9,21.0,69.6],
      ["Chunk-then-align", "π-Long",71.7,167.1,129.2,7.5,2.4,33.2,19.6,7.3,61.4,27.7,15.0,49.3],
      ["Block-wise streaming", "Drive3R",89.8,25.5,135.8,4.6,2.5,52.4,44.2,7.8,65.6,17.5,12.7,41.7]
    ]
  }
};
function renderResults(key) {
  const data = datasets[key];
  const isKitti = key === "kitti";
  const headings = isKitti ? ["Method", ...Array.from({length:11},(_,i)=>String(i).padStart(2,"0")), "Avg. ↓"] : ["Method", "AbsRel ↓", "δ < 1.25 ↑", "Accuracy ↓", "Completeness ↓", "AUC@30 ↑", "ATE ↓"];
  const table = document.getElementById("results-table");
  table.replaceChildren();
  const caption = table.createCaption(); caption.className = "sr-only"; caption.textContent = data.label + " results: " + data.protocol;
  const head = table.createTHead().insertRow();
  headings.forEach(label => { const th = document.createElement("th"); th.scope = "col"; th.textContent = label; head.append(th); });
  const best = headings.slice(1).map((_,col) => {
    const values = data.rows.map(row=>row[col+2]).filter(v=>v!==null);
    return !isKitti && (col===1 || col===4) ? Math.max(...values) : Math.min(...values);
  });
  const body = table.createTBody(); let group = "";
  data.rows.forEach(row => {
    if (row[0] !== group) { group = row[0]; const g = body.insertRow(); g.className = "group-row"; const cell = g.insertCell(); cell.colSpan = headings.length; cell.textContent = group; }
    const tr = body.insertRow(); if(row[1] === "Drive3R") tr.className = "ours-row";
    const th = document.createElement("th"); th.scope = "row"; th.textContent = row[1];
    if(row[1] === "Drive3R") { const tag = document.createElement("span"); tag.textContent = "Ours"; th.append(tag); }
    tr.append(th);
    row.slice(2).forEach((value,col) => {
      const cell = tr.insertCell();
      cell.textContent = value===null ? "OOM" : value.toFixed(isKitti ? 1 : (col===4 ? 2 : 4));
      if (isKitti && row[1] === "StreamVGGT" && col===11) cell.textContent += "†";
      if (value===best[col]) cell.className = "best";
    });
  });
  document.getElementById("result-heading").textContent = data.title;
  document.getElementById("result-protocol").textContent = data.protocol;
  document.getElementById("result-takeaway").textContent = data.takeaway;
  document.getElementById("result-footnote").textContent = isKitti ? "† StreamVGGT average is over completed sequences only; OOM marks failed sequences. Bold values indicate the best result in each column. See the paper for input counts and distance per sequence." : "* Relative-scale models are aligned to recover metric scale. Bold values indicate the best result in each column.";
  document.getElementById("result-panel").setAttribute("aria-labelledby", "result-tab-" + key);
}
initTabs("[data-benchmark]", tab => renderResults(tab.dataset.benchmark));
renderResults("nuscenes");
document.getElementById("copy-citation").addEventListener("click", async () => {
  const citation = document.getElementById("bibtex").textContent;
  const label = document.querySelector("#copy-citation span");
  try { await navigator.clipboard.writeText(citation); label.textContent = "Copied"; document.getElementById("copy-status").textContent = "Citation copied to clipboard."; }
  catch (_) { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(document.getElementById("bibtex")); selection.removeAllRanges(); selection.addRange(range); label.textContent = "Select & copy"; document.getElementById("copy-status").textContent = "Citation selected. Press Control C or Command C to copy."; }
});
