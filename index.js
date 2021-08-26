const { scrapeStats, render } = require("./scrape");
const cityNames = require("./cityNames");
// const nufus = require("./nufus.json");
const moment = require("moment-timezone");
const { tweetImages, reply } = require("./tweetUtils");
const { calculateNewRow, downloadCSV, appendCsv, uploadCSV } = require("./csv");
const TOTAL_NUFUS = 83614362;
// Write date and explanation
const date = moment().tz("Europe/Istanbul").locale("tr");
const dateStr = date.format("D MMMM YYYY dddd");

exports.tweetVaccinations = async () => {
  try {
    console.log(`It's ${date.hour()} o'clock in Turkey!`);
    if (!(date.hour() === 19 || process.env.NODE_ENV === "test")) {
      return;
    }
    const [vaccinationStats, totalCounts] = await scrapeStats();
    const totalFirstDoseRate = totalCounts.firstDoseCount / TOTAL_NUFUS;
    const totalSecondDoseRate = totalCounts.secondDoseCount / TOTAL_NUFUS;
    const totalThirdDoseRate = totalCounts.thirdDoseCount / TOTAL_NUFUS;
    // Calculate daily changes and write new row to .csv
    await downloadCSV();
    const newRow = await calculateNewRow(totalCounts);
    await appendCsv(newRow);

    console.log(newRow);
    const totalFirstDoseStr =
      "1. Doz tamamlanan\n" +
      generateProgressbar(totalFirstDoseRate) +
      "\n" +
      "24 saatte %" +
      newRow["TotalFirstChangePercentage"].toString().replace(".", ",") +
      " nufusa 1. doz aşı vuruldu (" +
      numberWithDots(newRow["TotalFirstChange"]) +
      " adet)";
    const totalSecondDoseStr =
      "2. Doz tamamlanan\n" +
      generateProgressbar(totalSecondDoseRate) +
      "\n" +
      "24 saatte %" +
      newRow["TotalSecondChangePercentage"].toString().replace(".", ",") +
      " nufusa 2. doz aşı vuruldu (" +
      numberWithDots(newRow["TotalSecondChange"]) +
      " adet)";
    const totalThirdDoseStr =
      "3. Doz tamamlanan\n" +
      generateProgressbar(totalThirdDoseRate) +
      "\n" +
      "24 saatte %" +
      newRow["TotalThirdChangePercentage"].toString().replace(".", ",") +
      " nufusa 3. doz aşı vuruldu (" +
      numberWithDots(newRow["TotalThirdChange"]) +
      " adet)";

    const status1 =
      "📆 " +
      dateStr +
      "\n\n" +
      totalFirstDoseStr +
      "\n\n" +
      totalSecondDoseStr;

    const status2 =
      totalThirdDoseStr +
      "\n\n" +
      "Rakamlar toplam nufusa göre aşılanan oranlarıdır. Bakanlık sitesi ve görseldeki yüzdeler 18 yaş üstü nufus oranlarıdır.";
    const image = await render(vaccinationStats, dateStr);
    const tweetResponse = await tweetImages(image, status1);
    console.log("Tweeted 1 successfully, id: " + tweetResponse.id_str);
    await reply(status2, tweetResponse.id_str);
    console.log("Tweeted 2 successfully");
    await uploadCSV();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
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
