const { scrapeStats, render } = require("./scrape");
const cityNames = require("./cityNames");
const nufus = require("./nufus.json");

const sumTotalFirstDose = (stats) => {
  return stats.reduce((accumulator, curr) => {
    return accumulator + curr.firstDose;
  }, 0);
};

(async function main() {
  // const stats = await scrapeStats();
  // console.log(stats);
  // console.log(sumTotalFirstDose(stats));
  await render();
  // process.exit();
})();
