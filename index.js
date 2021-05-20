const { scrapeStats, render } = require("./scrape");
const cityNames = require("./cityNames");
const nufus = require("./nufus.json");
const moment = require("moment-timezone");
const { tweetImages } = require("./tweetUtils");
const { calculateNewRow, downloadCSV, appendCsv, uploadCSV } = require("./csv");

// Write date and explanation
const date = moment().tz("Europe/Istanbul").locale("tr");
const dateStr = date.format("D MMMM YYYY dddd");

exports.tweetVaccinations = async () => {
  try {
    console.log(`It's ${date.hour()} o'clock in Turkey!`);
    if (!(date.hour() === 19 || process.env.NODE_ENV === "test")) {
      return;
    }
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

    // Calculate daily changes and write new row to .csv
    await downloadCSV();
    const newRow = await calculateNewRow(vaccinationStats);
    await appendCsv(newRow);

    const totalFirstDoseStr =
      "1. Doz tamamlanan\n" +
      generateProgressbar(totalFirstDoseRate) +
      "\n" +
      "24 saatte +%" +
      newRow["TotalFirstChangePercentage"].toString().replace(".", ",") +
      " (" +
      numberWithDots(newRow["TotalFirstChange"]) +
      " doz)";
    const totalSecondDoseStr =
      "2. Doz tamamlanan\n" +
      generateProgressbar(totalSecondDoseRate) +
      "\n" +
      "24 saatte +%" +
      newRow["TotalSecondChangePercentage"].toString().replace(".", ",") +
      " (" +
      numberWithDots(newRow["TotalSecondChange"]) +
      " doz)";

    const status =
      "📆 " +
      dateStr +
      "\n\n" +
      totalFirstDoseStr +
      "\n\n" +
      totalSecondDoseStr;
    console.log(status);
    const firstDoseImage = await render(vaccinationPercentages, false, dateStr);
    const secondDoseImage = await render(vaccinationPercentages, true, dateStr);
    await tweetImages(firstDoseImage, secondDoseImage, status);
    console.log("Tweeted successfully");
    await uploadCSV();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
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

function numberWithDots(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
