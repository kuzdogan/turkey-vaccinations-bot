const puppeteer = require("puppeteer");
const { turkishToAsciiChar } = require("./utils");
const coordinates = require("./coordinates.json");
const moment = require("moment-timezone");
const URL = "https://covid19asi.saglik.gov.tr/";

module.exports.scrapeStats = async () => {
  console.log("hello");
  console.log("Launching Browser");
  // const browser = await puppeteer.launch({ headless: false }); //debug
  console.log("Launching browser");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  // Load page
  console.log("Opened new page");
  const page = await browser.newPage();
  console.log("Going to the URL");
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  console.log("Loaded page");
  const vaccinationStats = await page.$$eval("#color1", (elements) => {
    const vaccinationStatsObj = {};
    elements.forEach((element) => {
      const cityName =
        element.getAttribute("data-adi") === "Afyon"
          ? "Afyonkarahisar"
          : element.getAttribute("data-adi");
      vaccinationStatsObj[cityName] = {
        firstDose: parseInt(
          element.getAttribute("data-birinci-doz").replace(/\./g, "")
        ),
        secondDose: parseInt(
          element.getAttribute("data-ikinci-doz").replace(/\./g, "")
        ),
      };
    });
    return vaccinationStatsObj;
  });
  browser.close();
  return vaccinationStats;
};

// render the map with color and percentages
module.exports.render = async (vaccinationPercentages, secondDose) => {
  // const browser = await puppeteer.launch({ headless: false }); //debug
  console.log("Launching browser");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  // Load page
  console.log("Opened new page");
  const page = await browser.newPage();
  console.log("Opening local html file");
  await page.goto(`file://${__dirname}/Turkey/index.html`, {
    waitUntil: "domcontentloaded",
  });

  // Hide city name above
  await page.$eval("#sehir", (elem) => (elem.style = "visibility: hidden"));

  // Write date and explanation
  const dateStr = moment()
    .tz("Europe/Istanbul")
    .locale("tr")
    .format("D MMMM YYYY dddd H:mm ");

  const labelStr = `${dateStr} il bazında ${
    secondDose ? "ikinci" : "birinci"
  } doz aşılama oranları`;
  await page.$eval(
    "#sehir",
    (sehirElem, labelStr) => {
      const label = document.createElement("div");
      label.innerHTML = labelStr;
      label.id = "label";
      label.style = `z-index: 100; margin: auto; text-align: center; margin-top: 0px; margin-bottom: -48px; font-size: 16pt;`;
      document.querySelector("body").insertBefore(label, sehirElem);
      const account = document.createElement("div");
      account.innerHTML = "@TurkiyeCovidAsilama";
      account.id = "label";
      account.style =
        "z-index: 100; text-align: center; padding-bottom: 16px; font-size: 14pt;";
      document.querySelector("body").insertBefore(account, sehirElem);
    },
    labelStr
  );

  // let i = 1.2; // debug instead of vaccinationPercentageFloat
  for (cityName in vaccinationPercentages) {
    const percentage = secondDose
      ? vaccinationPercentages[cityName].secondDose
      : vaccinationPercentages[cityName].firstDose;
    const asciiName = turkishToAsciiChar(cityName).toLowerCase();
    console.log(cityName);
    console.log(percentage);
    const vaccinationRate = (percentage / 100).toFixed(2);
    const vaccinationPercentageFloat = parseFloat(percentage);
    const hue = `${(50 + vaccinationPercentageFloat * 0.9).toFixed(0)}`;
    const saturation = `${(65 - vaccinationPercentageFloat * 0.4).toFixed(0)}%`;
    const light = `${(95 - vaccinationPercentageFloat * 0.6).toFixed(0)}%`;
    // console.log(i);
    console.log("Hue: " + hue);
    console.log("Sat: " + saturation);
    console.log("Light: " + light);
    await fillCityColorAndText(
      asciiName,
      `hsl(${hue}, ${saturation}, ${light}, 1)`,
      page,
      coordinates[asciiName],
      percentage
    );
    // i += 1.2;
  }

  const element = await page.$("svg");
  return element.screenshot({
    omitBackground: true,
    encoding: "base64",
  });
};

const fillCityColorAndText = async (
  cityName,
  color,
  page,
  coordinates,
  percentage
) => {
  const id = "#" + cityName.toLowerCase();
  return page.$eval(
    id,
    (el, cityName, color, coordinates, percentage) => {
      const text = document.createElement("div");
      text.innerHTML = `%${percentage}`;
      text.id = cityName;
      text.style = `position: absolute; top: ${coordinates.top}px; left: ${
        coordinates.left
      }px; ${coordinates.fontSize && `font-size: ${coordinates.fontSize}`}`;
      document.getElementById("map").appendChild(text);
      el.style.fill = color;
    },
    cityName,
    color,
    coordinates,
    percentage
  );
};
