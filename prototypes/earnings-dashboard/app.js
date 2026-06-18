/* =========================================================
   Earnings — Insights · prototype interactions
   - KPI cards drive the line chart (Patreon-style)
   - Pill tabs, dashboard tabs, client tabs
   - Side sheet drill-in for invoices & clients
   - State switcher (6 states)
   ========================================================= */
(function () {
  const body = document.body;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- KPI series for the line chart ---------------- */
  // 12 monthly points each (oldest → newest). Range pills slice the tail.
  const SERIES = {
    expected:   { label: "Expected earnings", color: "var(--interactive)",    avg: 20140,
      data: [15200,16800,15900,18020,17400,19100,18600,20540,21800,22100,23000,24180] },
    paid:       { label: "Paid",              color: "var(--positive)",       avg: 9600,
      data: [7200,8100,7600,8800,8200,9100,8900,9400,10200,10600,10900,11120] },
    scheduled:  { label: "Scheduled",         color: "var(--chart-paid)",     avg: 6200,
      data: [4800,5200,5600,5100,6000,5800,6400,6100,6800,7000,7100,7250] },
    overdue:    { label: "Overdue",           color: "var(--negative)",       avg: 2400,
      data: [1200,2100,1800,2600,1900,2400,3000,2200,2900,3100,3400,3650] },
    unconfirmed:{ label: "Unconfirmed",       color: "var(--text-secondary)", avg: 1700,
      data: [900,1400,1100,1800,1300,1600,2000,1500,1900,2050,2100,2160] },
  };
  const MONTHS = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];

  const svg = $("#lineChart");
  const W = 720, H = 260, padL = 8, padR = 14, padT = 18, padB = 28;
  let currentKpi = "expected";
  let currentRange = 6;

  function money(n){ return "$" + Math.round(n).toLocaleString("en-US"); }
  function el(tag, attrs){ const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function drawChart(kpi, range){
    const s = SERIES[kpi];
    const data = s.data.slice(-range);
    const labels = MONTHS.slice(-range);
    svg.innerHTML = "";
    svg.style.setProperty("--accent", s.color);

    const max = Math.max(...data) * 1.12;
    const min = Math.min(...data) * 0.82;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = i => padL + (plotW * (data.length === 1 ? 0.5 : i / (data.length - 1)));
    const y = v => padT + plotH * (1 - (v - min) / (max - min));

    // gridlines + y labels
    const grid = el("g", { class: "grid" });
    const axis = el("g", { class: "axis" });
    for (let g = 0; g <= 3; g++){
      const gy = padT + (plotH * g / 3);
      grid.appendChild(el("line", { x1: padL, y1: gy, x2: W - padR, y2: gy }));
      const val = max - (max - min) * g / 3;
      const tx = el("text", { x: padL, y: gy - 4 }); tx.textContent = money(val);
      axis.appendChild(tx);
    }
    svg.appendChild(grid);

    // area + line
    const linePts = data.map((v,i) => `${x(i)},${y(v)}`).join(" ");
    const areaD = `M ${x(0)},${y(data[0])} ` + data.map((v,i)=>`L ${x(i)},${y(v)}`).join(" ") +
                  ` L ${x(data.length-1)},${H-padB} L ${x(0)},${H-padB} Z`;

    const gradId = "grad-" + kpi;
    const defs = el("defs", {});
    const grad = el("linearGradient", { id: gradId, x1:"0", y1:"0", x2:"0", y2:"1" });
    grad.appendChild(el("stop", { offset:"0%",  "stop-color": s.color, "stop-opacity":"0.18" }));
    grad.appendChild(el("stop", { offset:"100%","stop-color": s.color, "stop-opacity":"0" }));
    defs.appendChild(grad); svg.appendChild(defs);

    svg.appendChild(el("path", { class:"series-area", d: areaD, fill:`url(#${gradId})` }));
    svg.appendChild(el("polyline", { class:"series-line", points: linePts }));

    // dots + x labels
    data.forEach((v,i) => {
      const last = i === data.length - 1;
      svg.appendChild(el("circle", { class: last ? "dot dot-last" : "dot", cx: x(i), cy: y(v), r: last ? 5 : 3.5 }));
      const tx = el("text", { x: x(i), y: H - 8, "text-anchor":"middle" }); tx.textContent = labels[i];
      axis.appendChild(tx);
    });
    svg.appendChild(axis);

    // header + legend
    $("#lineTitle").textContent = s.label + " over time";
    $("#lineLegend").innerHTML =
      `<div class="legend-card"><span class="sw" style="background:${s.color}"></span><span class="lc-label">${s.label}</span><span class="lc-value tnum">${money(data[data.length-1])}</span></div>` +
      `<div class="legend-card"><span class="sw" style="background:var(--text-secondary)"></span><span class="lc-label">${range}-mo avg</span><span class="lc-value tnum">${money(s.data.slice(-range).reduce((a,b)=>a+b,0)/range)}</span></div>`;
  }

  /* ---------------- KPI selection ---------------- */
  $$("#kpiRow .kpi").forEach(card => {
    card.addEventListener("click", () => {
      $$("#kpiRow .kpi").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      currentKpi = card.dataset.kpi;
      drawChart(currentKpi, currentRange);
    });
  });

  /* ---------------- Pill tabs ---------------- */
  $$('.pill-tabs').forEach(group => {
    group.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", group).forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      if (group.dataset.pills === "range") {
        currentRange = parseInt(b.dataset.range, 10);
        drawChart(currentKpi, currentRange);
      }
    });
  });

  /* ---------------- Dashboard tabs & chips ---------------- */
  $(".top-tabs").addEventListener("click", e => {
    const b = e.target.closest(".top-tab"); if (!b) return;
    $$(".top-tab").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
  });

  /* ---------------- Side sheet ---------------- */
  const sheet = $("#sideSheet"), overlay = $("#sheetOverlay");
  function openSheet(title, sub, amt, statusHTML){
    $("#sheetTitle").textContent = title;
    $("#sheetSub").textContent = sub;
    $("#sheetAmt").textContent = amt;
    if (statusHTML) $("#sheetStatus").innerHTML = statusHTML;
    sheet.classList.add("open"); overlay.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
  }
  function closeSheet(){
    sheet.classList.remove("open"); overlay.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
  }
  $("#sheetClose").addEventListener("click", closeSheet);
  overlay.addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

  // invoice rows
  $("#invBody").addEventListener("click", e => {
    if (e.target.closest("button")) return; // row action buttons don't open sheet
    const tr = e.target.closest("tr"); if (!tr) return;
    const statusTxt = tr.dataset.status;
    const cls = /Overdue/.test(statusTxt) ? "s-overdue" : /Due/.test(statusTxt) ? "s-duesoon"
              : /Paid/.test(statusTxt) ? "s-paid" : /Processing/.test(statusTxt) ? "s-processing"
              : /Sent/.test(statusTxt) ? "s-sent" : "s-draft";
    openSheet(
      "Invoice " + tr.dataset.inv,
      tr.dataset.client + " · " + tr.querySelector(".proj b").textContent.split("· ")[1],
      tr.dataset.amt,
      `<span class="status ${cls}"><span class="dot"></span>${statusTxt}</span>`
    );
  });

  // client rows
  $(".ranked").addEventListener("click", e => {
    const row = e.target.closest(".rrow"); if (!row || row.classList.contains("head")) return;
    const name = row.dataset.client;
    const out = row.querySelector(".money-out, td .money-out");
    openSheet(name, "Client overview", row.querySelector(".money-pos").textContent,
      `<span class="status s-paid"><span class="dot"></span>${name} · paid lifetime</span>`);
  });

  /* ---------------- State switcher ---------------- */
  const switcher = $("#switcher");
  const STORY = {
    empty:      { expected: "$0" },
    onboarding: { expected: "$9,400" },
    healthy:    { expected: "$23,900" },
    overdue:    { expected: "$24,180" },
    lowconf:    { expected: "$17,200" },
    growth:     { expected: "$24,180" },
  };
  function setState(state){
    body.setAttribute("data-state", state);
    $$("#switcher button").forEach(b => b.classList.toggle("on", b.dataset.go === state));
    const s = STORY[state];
    if (s && $("#kpiExpected")) $("#kpiExpected").textContent = s.expected;
    closeSheet();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  switcher.addEventListener("click", e => {
    const b = e.target.closest("button[data-go]"); if (b) setState(b.dataset.go);
  });
  const order = ["empty","onboarding","healthy","overdue","lowconf","growth"];
  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6) setState(order[n - 1]);
  });

  /* ---------------- init ---------------- */
  drawChart(currentKpi, currentRange);
  setState(body.getAttribute("data-state") || "overdue");
})();
