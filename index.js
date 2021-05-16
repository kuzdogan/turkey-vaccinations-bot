const { scrapeStats, render } = require("./scrape");
const cityNames = require("./cityNames");
const nufus = require("./nufus.json");

const sumTotalFirstDose = (stats) => {
  return stats.reduce((accumulator, curr) => {
    return accumulator + curr.firstDose;
  }, 0);
};

(async function main() {
  const vaccinationStats = await scrapeStats();
  const vaccinationPercentages = calculateVaccinationPercentages(
    vaccinationStats,
    nufus
  );
  // console.log(sumTotalFirstDose(stats));
  await render(vaccinationPercentages, false);
  // cityNames.forEach((cityName) =>
  //   console.log(`${cityName}: ${nufus[cityName]}`)
  // );
  // process.exit();
})();

const calculateVaccinationPercentages = (vaccinationStats, nufus) => {
  const vaccinationPercentages = {};
  for (city in vaccinationStats) {
    vaccinationPercentages[city] = {
      firstDose: (
        (vaccinationStats[city].firstDose / nufus[city]) *
        100
      ).toFixed(1),
      secondDose: (
        (vaccinationStats[city].secondDose * 100) /
        nufus[city]
      ).toFixed(1),
    };
  }
  return vaccinationPercentages;
};
