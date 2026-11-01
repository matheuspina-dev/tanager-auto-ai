// Pure business rules: no browser, network, or AI dependencies.
(function (root) {
  function amount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  function calculateProfit(costs) {
    const totalCost = [
      "price",
      "parts",
      "labor",
      "transport",
      "fees",
      "contingency",
    ].reduce((sum, key) => sum + amount(costs[key]), 0);
    return { totalCost, profit: amount(costs.resale) - totalCost };
  }
  function analyzeDescription(text) {
    const rules = [
      [
        /misfire|runs rough|rough idle/i,
        "Rough running / misfire mentioned",
        "Read codes, check compression, and diagnose before pricing ignition parts.",
      ],
      [
        /overheat|head gasket/i,
        "Cooling or head-gasket concern mentioned",
        "Pressure-test the cooling system and check for engine damage.",
      ],
      [
        /transmission|won.t shift|slipping/i,
        "Transmission concern mentioned",
        "Budget for diagnosis; a solenoid repair is not established by seller text.",
      ],
      [
        /brake|rotor/i,
        "Brake work mentioned",
        "Inspect pads, rotors, calipers, and brake lines.",
      ],
      [
        /no start|won.t start|doesn.t start/i,
        "Non-running vehicle mentioned",
        "Verify engine rotation, compression, fuel, and ignition.",
      ],
      [
        /oil leak/i,
        "Oil leak mentioned",
        "Locate the leak and check oil level before running.",
      ],
    ];
    const matches = rules.filter((rule) => rule[0].test(text));
    return {
      symptoms: matches.map((rule) => rule[1]),
      questions: matches.map((rule) => rule[2]),
      risk: matches.some((rule) =>
        /Cooling|Transmission|Non-running/.test(rule[1]),
      )
        ? "High"
        : matches.length
          ? "Medium"
          : "Unknown",
    };
  }
  function terms(value) {
    return value
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);
  }
  function matchesFilters(listing, filters) {
    const text = (listing.title + " " + listing.description).toLowerCase();
    const include = terms(filters.query || "");
    return (
      listing.price <= filters.maxPrice &&
      listing.distance <= filters.radius &&
      listing.mileage <= filters.mileage &&
      (!filters.make || listing.make === filters.make) &&
      (!filters.clean || listing.cleanTitle) &&
      (!include.length || include.some((term) => text.includes(term))) &&
      !terms(filters.exclude || "").some((term) => text.includes(term)) &&
      calculateProfit(listing).profit >= filters.minProfit
    );
  }
  const api = { calculateProfit, analyzeDescription, matchesFilters };
  if (typeof module !== "undefined") module.exports = api;
  root.FlipDomain = api;
})(typeof window !== "undefined" ? window : globalThis);
