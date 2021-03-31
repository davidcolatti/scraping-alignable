const fs = require("fs");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { convertArrayToCSV } = require("convert-array-to-csv");

const scrapePage = async (id, page) => {
  const html = await page.content();
  const $ = await cheerio.load(html);

  const business_name = $("head title").text().split("-")[0].trim();
  const category = $(".business-tags__clickable-tag").text().split("\n")[0];

  const phone_number = $(
    "li:nth-child(3) > div.u--td.profile-info__item > a"
  ).text();

  const location = $("li:nth-child(1) > div.u--td.profile-info__item > a")
    .text()
    .split(",")[1]
    .trim();

  const page_url = page.url();

  const data = {
    id,
    business_name,
    phone_number,
    category,
    location,
    page_url,
  };

  return data;
};

const main = async (id, count) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const results = [];

  for (let i = 0; i < count; i++) {
    const url = `https://www.alignable.com/biz/businesses/${id}`;

    try {
      await page.goto(url);

      await page.waitForSelector(".business-profile-banner__text-line1", {
        timeout: 1000,
      });

      const data = await scrapePage(id, page);

      results.push(data);

      const csv = await convertArrayToCSV(results);

      fs.writeFile("./output.csv", csv, () => {});

      console.log(
        `${i}: Successfully scraped ${data.business_name} from ${url}`
      );
    } catch {
      console.log(`${i}: No Data Found ${url}`);
    }

    id++;
  }

  await browser.close();
};

main(5466582, 5000);
