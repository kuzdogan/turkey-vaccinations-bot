const csv = require("fast-csv");
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const BUCKET_NAME = "covid-asilama";
const FILE_NAME = "vac-percentages.csv";
const LOCAL_FILE_PATH = "/tmp/" + FILE_NAME;
const storage = new Storage();
const nufus = require("./nufus.json");
const moment = require("moment");
const TOTAL_NUFUS = 83614362;

/**
 * Downloads the file from GC Storage. Appends the new row. Uploads the file back.
 *
 * @param {*} rowObject
 * @returns
 */
exports.uploadCSV = async () => {
  await storage
    .bucket(BUCKET_NAME)
    .upload(LOCAL_FILE_PATH, { destination: FILE_NAME });
  console.log(`${LOCAL_FILE_PATH} uploaded to ${BUCKET_NAME}`);
};

exports.downloadCSV = async () => {
  await storage
    .bucket(BUCKET_NAME)
    .file(FILE_NAME)
    .download({ destination: LOCAL_FILE_PATH });
  console.log(
    `gs://${BUCKET_NAME}/${FILE_NAME} downloaded to ${LOCAL_FILE_PATH}.`
  );
};

exports.appendCsv = (rowObject) => {
  return new Promise((resolve, reject) => {
    const fsWriteStream = fs.createWriteStream(LOCAL_FILE_PATH, { flags: "a" }); // append flag.
    const csvStream = csv.format({
      headers: true,
      writeHeaders: false,
      includeEndRowDelimiter: true,
    });
    csvStream
      .pipe(fsWriteStream)
      .on("finish", () => {
        console.log("Finished writing to .csv");
        resolve();
      })
      .on("error", () => {
        console.error("Error writing to .csv");
        reject();
      });

    csvStream.write(rowObject);
    csvStream.end();
  });
};

/**
 * Function to calculate the new row of the csv: total vaccinations, vaccinations of each city and  vaccination differences from the past day in numbers and percentages.
 *
 * @param {Object} statsObject new extracted stats
 * @return {Object}
 * @example {
 *  TotalFirst: 12432423,
 *  TotalFirstChange: 214132,
 *  TotalFirstChangePercentage: 2.1,
 *  TotalSecond: 12432423,
 *  TotalSecondChange: 214132,
 *  TotalSecondChangePercentage: 1.3,
 *  AdanaFirst: 937821
 *  AdanaFirstChange: 16421,
 *  AdanaFirstChangePercentage: 1.2,
 *  ...
 * }
 */
exports.calculateNewRow = async (totalCounts) => {
  const newRowObject = {
    Tarih: moment().format("YYYY-MM-DD"),
  };
  console.log("Total population is: " + TOTAL_NUFUS);
  const previousDayObject = await getPreviousDayRowAsObject(LOCAL_FILE_PATH);

  console.log(previousDayObject);

  newRowObject["TotalFirst"] = totalCounts.firstDoseCount;
  newRowObject["TotalSecond"] = totalCounts.secondDoseCount;
  newRowObject["TotalThird"] = totalCounts.thirdDoseCount;

  // No change if no previousDayObject ie first time writing.
  if (previousDayObject) {
    const pastTotalFirst = previousDayObject["TotalFirst"];
    const pastTotalSecond = previousDayObject["TotalSecond"];
    const pastTotalThird = previousDayObject["TotalThird"];
    const totalDiffFirst = totalCounts.firstDoseCount - pastTotalFirst;
    const totalDiffSecond = totalCounts.secondDoseCount - pastTotalSecond;
    const totalDiffThird = totalCounts.thirdDoseCount - pastTotalThird;
    newRowObject["TotalFirstChange"] = totalDiffFirst;
    newRowObject["TotalSecondChange"] = totalDiffSecond;
    newRowObject["TotalThirdChange"] = totalDiffThird;
    newRowObject["TotalFirstChangePercentage"] = parseFloat(
      ((totalDiffFirst / TOTAL_NUFUS) * 100).toFixed(1)
    );
    newRowObject["TotalSecondChangePercentage"] = parseFloat(
      ((totalDiffSecond / TOTAL_NUFUS) * 100).toFixed(1)
    );
    newRowObject["TotalThirdChangePercentage"] = parseFloat(
      ((totalDiffThird / TOTAL_NUFUS) * 100).toFixed(1)
    );
  } else {
    newRowObject["TotalFirstChange"] = 0;
    newRowObject["TotalSecondChange"] = 0;
    newRowObject["TotalThirdChange"] = 0;
    newRowObject["TotalFirstChangePercentage"] = 0;
    newRowObject["TotalSecondChangePercentage"] = 0;
    newRowObject["TotalThirdChangePercentage"] = 0;
  }

  return newRowObject;
};

/**
 * Function to parse the last row of the .csv file. To be used in calculating differences.
 *
 * @param {String} filePath
 * @returns {Promise<Object>} last row of the .csv as object. Undefined if does not exist.
 */
function getPreviousDayRowAsObject(filePath) {
  return new Promise((resolve, reject) => {
    // return null if file does not exist
    if (!fs.existsSync(filePath)) {
      console.log(filePath + " does not exist!");
      resolve(null);
    }
    let lastRow;
    console.log("Reading file: " + filePath);
    csv
      .parseFile(filePath, { headers: true })
      .on("error", (error) => reject(error))
      .on("data", (row) => {
        lastRow = row;
      })
      .on("end", (rowCount) => {
        console.log(`Parsed ${rowCount} rows`);
        resolve(lastRow);
      });
  });
}
