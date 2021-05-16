const puppeteer = require("puppeteer");
const { turkishToAsciiChar } = require("./utils");
const coordinates = require("./coordinates.json");
const cityNames = require("./cityNames").map((city) =>
  turkishToAsciiChar(city).toLowerCase()
);

const URL = "https://covid19asi.saglik.gov.tr/";

module.exports.scrapeStats = async () => {
  console.log("hello");
  console.log("Launching Browser");
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch({ headless: true });

  // Load page
  console.log("Opened new page");
  const page = await browser.newPage();
  console.log("Going to the URL");
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  console.log("Loaded page");
  const stats = await page.$$eval("#color1", (elements) => {
    return elements.map((element) => {
      return {
        cityName: element.getAttribute("data-adi"),
        firstDose: parseInt(
          element.getAttribute("data-birinci-doz").replace(/\./g, "")
        ),
        secondDose: parseInt(
          element.getAttribute("data-ikinci-doz").replace(/\./g, "")
        ),
      };
    });
  });
  browser.close();
  return stats;
};

// render the map with color and percentages
module.exports.render = async (stats) => {
  const browser = await puppeteer.launch({ headless: false });
  // const browser = await puppeteer.launch({ headless: true });

  // Load page
  console.log("Opened new page");
  const page = await browser.newPage();
  console.log("Opening local html file");
  await page.goto(`file://${__dirname}/Turkey/index.html`, {
    waitUntil: "domcontentloaded",
  });

  for (cityName of cityNames) {
    console.log(cityName);
    await fillCityColorAndText(
      cityName,
      "red",
      page,
      coordinates[cityName],
      99
    );
  }

  const element = await page.$("#map");

  if (element) {
    await element.screenshot({
      path: `./screenshot.png`,
      omitBackground: true,
    });
  }
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
