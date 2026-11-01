const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateProfit,
  analyzeDescription,
  matchesFilters,
} = require("../src/domain.js");
test("profit includes every investment category and retains losses", () => {
  const costs = {
    price: 2500,
    resale: 5500,
    parts: 500,
    labor: 400,
    transport: 100,
    fees: 300,
    contingency: 500,
  };
  assert.deepEqual(calculateProfit(costs), { totalCost: 4300, profit: 1200 });
  assert.equal(calculateProfit({ ...costs, resale: 3000 }).profit, -1300);
});
test("untrusted numeric values do not propagate NaN or negative costs", () => {
  assert.deepEqual(
    calculateProfit({ price: "bad", parts: -500, resale: 100 }),
    { totalCost: 0, profit: 100 },
  );
});
test("seller coil claim does not turn into confirmed diagnosis or repair price", () => {
  const result = analyzeDescription("Runs rough; seller thinks it is a coil");
  assert.equal(result.risk, "Medium");
  assert.equal(result.symptoms.length, 1);
  assert.match(result.questions[0], /diagnose/);
  assert.equal(result.repairCost, undefined);
  assert.equal(analyzeDescription("Transmission slipping").risk, "High");
  assert.equal(analyzeDescription("Nice car").risk, "Unknown");
});
test("filters enforce exclusions, title requirements and profit together", () => {
  const item = {
    title: "Toyota Camry",
    description: "Misfire, needs brakes",
    make: "Toyota",
    price: 2000,
    resale: 5000,
    distance: 20,
    mileage: 150000,
    cleanTitle: true,
  };
  const filters = {
    query: "misfire, overheating",
    maxPrice: 4000,
    radius: 100,
    mileage: 180000,
    minProfit: 1000,
    make: "Toyota",
    clean: true,
    exclude: "no title,parts only",
  };
  assert.equal(matchesFilters(item, filters), true);
  assert.equal(
    matchesFilters({ ...item, description: "Misfire, parts only" }, filters),
    false,
  );
  assert.equal(matchesFilters({ ...item, cleanTitle: false }, filters), false);
  assert.equal(matchesFilters({ ...item, price: 4500 }, filters), false);
});
