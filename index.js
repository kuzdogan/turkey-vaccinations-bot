const { scrapeStats, render } = require("./scrape");
const cityNames = require("./cityNames");
const nufus = require("./nufus.json");
const moment = require("moment-timezone");

// Write date and explanation
const dateStr = moment()
  .tz("Europe/Istanbul")
  .locale("tr")
  .format("D MMMM YYYY dddd HH:mm ");

exports.tweetVaccinations = async () => {
  const vaccinationStats = await scrapeStats();
  const vaccinationPercentages = calculateVaccinationPercentages(
    vaccinationStats,
    nufus
  );
  let totalPopulation = 0;
  totalFirstDoses = 0;
  totalSecondDoses = 0;
  for (cityName in vaccinationStats) {
    totalFirstDoses += vaccinationStats[cityName].firstDose;
    totalSecondDoses += vaccinationStats[cityName].secondDose;
    totalPopulation += nufus[cityName];
  }
  const totalFirstDoseRate = totalFirstDoses / totalPopulation;
  const totalSecondDoseRate = totalSecondDoses / totalPopulation;
  const totalFirstDoseStr =
    generateProgressbar(totalFirstDoseRate) + " 1. Doz tamamlanan";
  const totalSecondDoseStr =
    generateProgressbar(totalSecondDoseRate) + " 2. Doz tamamlanan";
  const status = dateStr + "\n" + totalFirstDoseStr + "\n" + totalSecondDoseStr;
  console.log(status);
  const firstDoseImage = await render(vaccinationPercentages, false, dateStr);
  const secondDoseImage = await render(vaccinationPercentages, true, dateStr);
  // console.log(firstDoseImage);
  // cityNames.forEach((cityName) =>
  //   console.log(`${cityName}: ${nufus[cityName]}`)
  // );
  // process.exit();
};

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

const generateProgressbar = (rate) => {
  const numChars = 15;
  const numFilled = Math.round(rate * numChars);
  const numEmpty = numChars - numFilled;
  displayPercentage = (rate * 100).toFixed(1).replace(".", ",");
  msg = "▓".repeat(numFilled) + "░".repeat(numEmpty) + " %" + displayPercentage;
  return msg;
};
