const puppeteer = require("puppeteer");
const { turkishToAsciiChar } = require("./utils");
const coordinates = require("./coordinates.json");
const URL = "https://covid19asi.saglik.gov.tr/";

/**
 * Puppeteer function to scrape vaccination percentages of each city from https://covid19asi.saglik.gov.tr.
 *
 * @returns {Object} cumulative vaccinations stats
 * @example {
 *  Adana: 83,2
 *  Bursa: ...
 *  ...
 * }
 */
module.exports.scrapeStats = async () => {
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
  await page.goto(URL, { waitUntil: "networkidle2" });
  console.log("Loaded page");
  const vaccinationStats = await page.$eval(
    "#turkiye-tamamlanan",
    (wrapper) => {
      const vaccinationPercentagesObj = {};
      // skip first element <defs></defs>
      for (let i = 1; i < wrapper.children.length; i++) {
        const element = wrapper.children[i];
        const cityName =
          element.getAttribute("data-adi") === "Afyon"
            ? "Afyonkarahisar"
            : element.getAttribute("data-adi");
        vaccinationPercentagesObj[cityName] = parseFloat(
          element.getAttribute("data-yuzde").slice(2)
        );
      }
      return vaccinationPercentagesObj;
    }
  );
  console.log(vaccinationStats);
  const firstDoseCount = await page.$eval(".doz1asisayisi", (element) => {
    return parseInt(element.innerText.replace(/\./g, ""));
  });
  const secondDoseCount = await page.$eval(".doz2asisayisi", (element) => {
    return parseInt(element.innerText.replace(/\./g, ""));
  });
  const thirdDoseCount = await page.$eval(".doz3asisayisi", (element) => {
    return parseInt(element.innerText.replace(/\./g, ""));
  });
  console.log("====Dose couints====");
  console.log(firstDoseCount);
  console.log(secondDoseCount);
  console.log(thirdDoseCount);
  browser.close();
  return [
    vaccinationStats,
    { firstDoseCount, secondDoseCount, thirdDoseCount },
  ];
};

// render the map with color and percentages
module.exports.render = async (vaccinationPercentages, dateStr) => {
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

  const labelStr = `${dateStr} il bazında <u><b>18 yaş üstü birinci doz</b></u> aşılama oranları`;
  await page.$eval(
    "#sehir",
    (sehirElem, labelStr) => {
      const label = document.createElement("div");
      label.innerHTML = labelStr;
      label.id = "label";
      label.style = `z-index: 100; margin: auto; text-align: center; margin-top: 0px; margin-bottom: -48px; font-size: 16pt;`;
      document.querySelector("body").insertBefore(label, sehirElem);
      const account = document.createElement("div");
      account.innerHTML = "@TurkiyeAsilama";
      account.id = "label";
      account.style =
        "z-index: 100; text-align: center; padding-bottom: 16px; font-size: 14pt;";
      document.querySelector("body").insertBefore(account, sehirElem);
    },
    labelStr
  );

  // let i = 1.2; // debug instead of vaccinationPercentageFloat
  for (cityName in vaccinationPercentages) {
    const percentage = vaccinationPercentages[cityName];
    const asciiName = turkishToAsciiChar(cityName).toLowerCase();
    // console.log(cityName);
    // console.log(percentage);
    const vaccinationPercentageFloat = parseFloat(percentage);
    const hue = `${(50 + vaccinationPercentageFloat * 0.9).toFixed(0)}`;
    const saturation = `${(65 - vaccinationPercentageFloat * 0.4).toFixed(0)}%`;
    const light = `${(95 - vaccinationPercentageFloat * 0.6).toFixed(0)}%`;
    // console.log(i);
    // console.log("Hue: " + hue);
    // console.log("Sat: " + saturation);
    // console.log("Light: " + light);
    await fillCityColorAndText(
      asciiName,
      `hsl(${hue}, ${saturation}, ${light}, 1)`,
      page,
      coordinates[asciiName],
      percentage
    );
    // i += 1.2;
  }

  console.log(`Taking screenshot`);
  const element = await page.$("svg");
  return element.screenshot({
    // path: `./screenshot.png`,
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
