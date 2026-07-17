import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5175/');
await page.waitForTimeout(500);

const styleCheck = await page.evaluate(() => {
  const navEl = document.querySelector('nav');
  const containerEl = navEl.parentElement;
  const graphWrapper = navEl.nextElementSibling;
  const navStyle = getComputedStyle(navEl);
  const containerStyle = getComputedStyle(containerEl);
  return {
    nav_alignSelf: navStyle.alignSelf,
    nav_flex: navStyle.flex,
    nav_height: navEl.getBoundingClientRect().height,
    container_flex: containerStyle.flex,
    container_display: containerStyle.display,
    container_height: containerEl.getBoundingClientRect().height,
    graphWrapper_flex: graphWrapper ? getComputedStyle(graphWrapper).flex : null,
    graphWrapper_height: graphWrapper ? graphWrapper.getBoundingClientRect().height : null,
  };
});
console.log(styleCheck);
await browser.close();
