const csv = require("fast-csv");
const path = require("path");
const fs = require("fs");
const FILE_PATH = path.join(__dirname, "/csv", "vac-stats.csv");

exports.appendCsv = (rowObject) => {
  return new Promise((resolve, reject) => {
    const fsWriteStream = fs.createWriteStream(FILE_PATH, { flags: "a" }); // append flag.
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
exports.calculateNewRow = async (statsObject) => {
  const newRowObject = {};
  const previousDayObject = await getPreviousDayRowAsObject(FILE_PATH);

  let newTotalFirst = 0;
  let newTotalSecond = 0;
  for (city in statsObject) {
    // Skip total columns
    if (city.match("Total*")) continue;

    // Calculate first dose.
    const todaysCityVaccinationFirst = statsObject[city].firstDose;
    newRowObject[city + "First"] = todaysCityVaccinationFirst;
    newTotalFirst += todaysCityVaccinationFirst;

    // Calculate second dose.
    const todaysCityVaccinationSecond = statsObject[city].secondDose;
    newRowObject[city + "Second"] = todaysCityVaccinationSecond;
    newTotalSecond += todaysCityVaccinationSecond;

    // If previousDayObject is falsey, first time writing to .csv i.e. no difference/percentage etc.
    if (previousDayObject) {
      // Calculate Difference
      const pastCityVaccinationFirst = previousDayObject[city + "First"];
      const diffFirst = todaysCityVaccinationFirst - pastCityVaccinationFirst;
      newRowObject[`${city}FirstChange`] = diffFirst;

      // Calculate Difference
      const pastCityVaccinationSecond = previousDayObject[city + "Second"];
      const diffSecond =
        todaysCityVaccinationSecond - pastCityVaccinationSecond;
      newRowObject[`${city}SecondChange`] = diffSecond;

      // Calculate percentage of change
      const diffFirstPercentage = parseFloat(
        ((diffFirst / pastCityVaccinationFirst) * 100).toFixed(1)
      );
      newRowObject[`${city}FirstChangePercentage`] = diffFirstPercentage;

      // Calculate percentage of change
      const diffSecondPercentage = parseFloat(
        ((diffSecond / pastCityVaccinationSecond) * 100).toFixed(1)
      );
      newRowObject[`${city}SecondChangePercentage`] = diffSecondPercentage;
    } else {
      newRowObject[`${city}FirstChange`] = 0;
      newRowObject[`${city}SecondChange`] = 0;
      newRowObject[`${city}FirstChangePercentage`] = 0;
      newRowObject[`${city}SecondChangePercentage`] = 0;
    }
  }

  // Write totals.
  console.log("New first dose total is: " + newTotalFirst);
  console.log("New second dose total is: " + newTotalSecond);
  newRowObject["TotalFirst"] = newTotalFirst;
  newRowObject["TotalSecond"] = newTotalSecond;

  // No change if no previousDayObject ie first time writing.
  if (previousDayObject) {
    const pastTotalFirst = previousDayObject["TotalFirst"];
    const pastTotalSecond = previousDayObject["TotalSecond"];
    const totalDiffFirst = newTotalFirst - pastTotalFirst;
    const totalDiffSecond = newTotalSecond - pastTotalSecond;
    newRowObject["TotalFirstChange"] = totalDiffFirst;
    newRowObject["TotalSecondChange"] = totalDiffSecond;
    newRowObject["TotalFirstChangePercentage"] = parseFloat(
      ((totalDiffFirst / pastTotalFirst) * 100).toFixed(1)
    );
    newRowObject["TotalSecondChangePercentage"] = parseFloat(
      ((totalDiffSecond / pastTotalSecond) * 100).toFixed(1)
    );
  } else {
    newRowObject["TotalFirstChange"] = 0;
    newRowObject["TotalSecondChange"] = 0;
    newRowObject["TotalFirstChangePercentage"] = 0;
    newRowObject["TotalSecondChangePercentage"] = 0;
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
