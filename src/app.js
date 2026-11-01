// UI layer. Domain calculations live in domain.js; fixtures live in data.js.
const $ = (id) => document.getElementById(id);
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const storage = {
  read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      toast("Browser storage unavailable. Changes last for this session.");
    }
  },
};
let listings = DEMO_LISTINGS.map((item) => ({ ...item }));
let saved = new Set(
  storage.read("flipscout.saved", []).filter((id) => typeof id === "string"),
);
let watchlist = false;
let activeFilters;
const overrides = storage.read("flipscout.costs", {});
for (const item of listings)
  if (overrides[item.id])
    for (const field of [
      "price",
      "resale",
      "parts",
      "labor",
      "transport",
      "fees",
      "contingency",
    ]) {
      if (
        Number.isFinite(overrides[item.id][field]) &&
        overrides[item.id][field] >= 0
      )
        item[field] = overrides[item.id][field];
    }
function toast(message) {
  $("toast").textContent = message;
  $("toast").style.display = "block";
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").style.display = "none"), 2800);
}
function readFilters() {
  return {
    query: $("query").value,
    maxPrice:
      $("max-price").value === "" ? Infinity : Number($("max-price").value),
    radius: $("radius").value === "" ? Infinity : Number($("radius").value),
    make: $("make").value,
    mileage: $("mileage").value === "" ? Infinity : Number($("mileage").value),
    minProfit: Number($("min-profit").value),
    exclude: $("exclude").value,
    clean: $("clean").checked,
  };
}
function carSvg(color) {
  return `<svg viewBox="0 0 340 135" aria-hidden="true"><ellipse cx="173" cy="112" rx="139" ry="9" fill="#50614b" opacity=".16"/><path d="M30 86L48 65L102 57L135 28Q143 22 159 22H211Q223 23 237 39L259 63L305 72Q319 76 319 89V102H25V91Z" fill="${color}"/><path d="M113 57L143 30H169V57ZM177 30H209Q218 31 230 45L241 58H177Z" fill="#30423f"/><path d="M119 53L146 33H165V36Z" fill="#c5d7d2" opacity=".6"/><path d="M35 84H310M177 61V95M103 63L98 93" stroke="#1c302d" opacity=".23" fill="none"/><rect x="40" y="72" width="31" height="9" rx="3" fill="#e8e6d4"/><path d="M299 75H314V86H303Z" fill="#a84738"/><rect x="186" y="65" width="14" height="3" rx="1.5" fill="#cad2c8"/><circle cx="84" cy="101" r="22" fill="#2c3332"/><circle cx="84" cy="101" r="12" fill="#bac2bb"/><circle cx="84" cy="101" r="5" fill="#69766d"/><circle cx="265" cy="101" r="22" fill="#2c3332"/><circle cx="265" cy="101" r="12" fill="#bac2bb"/><circle cx="265" cy="101" r="5" fill="#69766d"/></svg>`;
}
function render() {
  const filtered = listings.filter(
    (item) =>
      (!watchlist || saved.has(item.id)) &&
      FlipDomain.matchesFilters(item, activeFilters),
  );
  const sort = $("sort").value;
  filtered.sort((a, b) =>
    sort === "price"
      ? a.price - b.price
      : sort === "distance"
        ? a.distance - b.distance
        : FlipDomain.calculateProfit(b).profit -
          FlipDomain.calculateProfit(a).profit,
  );
  $("matches").textContent = filtered.length;
  $("best").textContent = filtered.length
    ? money(
        Math.max(
          ...filtered.map((item) => FlipDomain.calculateProfit(item).profit),
        ),
      )
    : "—";
  $("saved-count").textContent = $("saved-stat").textContent = listings.filter(
    (item) => saved.has(item.id),
  ).length;
  $("results-title").textContent = watchlist
    ? "Your watchlist"
    : "Opportunities";
  $("result-count").textContent = `${filtered.length} results`;
  $("discover").classList.toggle("active", !watchlist);
  $("saved").classList.toggle("active", watchlist);
  $("cards").innerHTML = filtered.length
    ? filtered
        .map((item) => {
          const { profit } = FlipDomain.calculateProfit(item);
          const risk = FlipDomain.analyzeDescription(item.description).risk;
          return `<article class="card"><div class="car-scene">${carSvg(item.color)}<span class="scene-label">FICTIONAL LISTING</span><button class="save ${saved.has(item.id) ? "selected" : ""}" data-save="${item.id}" aria-label="${saved.has(item.id) ? "Unsave" : "Save"} ${escapeHtml(item.title)}" aria-pressed="${saved.has(item.id)}">${saved.has(item.id) ? "★" : "☆"}</button></div><div class="card-content"><h3>${escapeHtml(item.title)}</h3><div class="meta">${item.mileage.toLocaleString()} mi · ${escapeHtml(item.city)} · ${item.distance} mi away</div><div class="price-row"><div class="price"><small>ASKING PRICE</small>${money(item.price)}</div><div class="profit ${profit < 0 ? "negative" : ""}">${profit >= 0 ? "+" : ""}${money(profit)}<small>est. net profit</small></div></div><div class="tags"><span class="tag">${item.cleanTitle ? "Clean title reported" : "Rebuilt title reported"}</span><span class="tag risk">${risk} uncertainty</span></div><div class="card-footer"><span>Sample data · ${escapeHtml(item.tag)}</span><button class="inspect" data-inspect="${item.id}">Inspect deal ↗</button></div></div></article>`;
        })
        .join("")
    : '<div class="empty"><strong>No matching opportunities</strong>Try widening your filters or saving a deal first.</div>';
}
$("filters").addEventListener("submit", (event) => {
  event.preventDefault();
  activeFilters = readFilters();
  render();
});
$("reset-filters").onclick = () => {
  $("filters").reset();
  activeFilters = readFilters();
  render();
};
$("sort").onchange = render;
$("discover").onclick = () => {
  watchlist = false;
  render();
};
$("saved").onclick = () => {
  watchlist = true;
  render();
};
$("cards").onclick = (event) => {
  const saveButton = event.target.closest("[data-save]");
  if (saveButton) {
    const id = saveButton.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    storage.write("flipscout.saved", [...saved]);
    render();
    return;
  }
  const inspect = event.target.closest("[data-inspect]");
  if (inspect) openDetail(inspect.dataset.inspect);
};
function openDetail(id) {
  const item = listings.find((item) => item.id === id);
  const analysis = FlipDomain.analyzeDescription(item.description);
  const fields = {
    price: "Purchase price",
    resale: "Expected resale",
    parts: "Parts",
    labor: "Labor allowance",
    transport: "Transport",
    fees: "Taxes / fees",
    contingency: "Contingency",
  };
  $("detail-content").innerHTML =
    `<div class="panel-title"><div><div class="eyebrow">DEAL WORKBENCH</div><h2 style="margin-top:8px">${escapeHtml(item.title)}</h2></div><button class="icon" id="close-detail" aria-label="Close">×</button></div><p class="muted">${escapeHtml(item.city)} · ${item.mileage.toLocaleString()} miles · ${item.cleanTitle ? "Clean" : "Rebuilt"} title reported</p><p class="description">“${escapeHtml(item.description)}”</p><div class="detail-grid"><section class="analysis"><h3>◈ Description analysis</h3><span class="tag risk">Keyword rules · ${analysis.risk} uncertainty</span><h3>What the text mentions</h3><ul>${(analysis.symptoms.length ? analysis.symptoms : ["No recognized symptoms. Condition is unknown."]).map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul><h3>Before you buy</h3><ul>${[...analysis.questions, "Verify title, VIN, and vehicle condition in person."].map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul><p class="hint">Keyword matches can miss context or negation. No diagnosis is confirmed. Resale and repair budgets are sample assumptions; no comparable sales have been fetched.</p></section><section class="budget"><h2>Run your numbers</h2><form id="cost-form">${Object.entries(
      fields,
    )
      .map(
        ([key, label]) =>
          `<label>${label} ($)<input type="number" min="0" step="1" required name="${key}" value="${item[key]}"></label>`,
      )
      .join(
        "",
      )}<div class="estimate"><span>Estimated profit</span><strong id="detail-profit"></strong></div><p class="hint" id="total-cost"></p><button class="primary full">Save assumptions →</button></form></section></div>`;
  $("close-detail").onclick = () => $("detail").close();
  const form = $("cost-form");
  function values() {
    return Object.fromEntries(
      Object.keys(fields).map((key) => [
        key,
        Number(form.elements.namedItem(key).value),
      ]),
    );
  }
  function update() {
    const result = FlipDomain.calculateProfit(values());
    $("detail-profit").textContent = money(result.profit);
    $("detail-profit").classList.toggle("negative", result.profit < 0);
    $("total-cost").textContent =
      `Total investment: ${money(result.totalCost)}. Profit excludes any costs you have not entered.`;
  }
  form.oninput = update;
  form.onsubmit = (event) => {
    event.preventDefault();
    Object.assign(item, values());
    const all = storage.read("flipscout.costs", {});
    all[id] = values();
    storage.write("flipscout.costs", all);
    render();
    toast("Assumptions saved");
  };
  update();
  if (!$("detail").open) $("detail").showModal();
}
$("add").onclick = () => $("add-dialog").showModal();
$("close-add").onclick = () => $("add-dialog").close();
$("add-form").onsubmit = (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const id = "manual-" + Date.now();
  listings.push({
    id,
    title: form.get("title"),
    make: "Other",
    price: Number(form.get("price")),
    resale: Number(form.get("resale")),
    description: form.get("description"),
    parts: 0,
    labor: 0,
    transport: 0,
    fees: 0,
    contingency: 0,
    mileage: 0,
    distance: 0,
    city: "Manual entry",
    cleanTitle: false,
    color: "#85978a",
    tag: "Manual entry",
  });
  $("add-dialog").close();
  event.target.reset();
  openDetail(id);
  toast(
    "Manual entries last for this session. Enter all repair and ownership costs.",
  );
};
activeFilters = readFilters();
render();
