import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5175/');
await page.waitForTimeout(500);

// Measure nav container (navRef target: the flex container wrapping <nav> + graph)
// and the <nav> element itself.
const navMeasure = await page.evaluate(() => {
  const navEl = document.querySelector('nav');
  const navRect = navEl.getBoundingClientRect();
  // The navRef container is nav's parent (flex row wrapping nav + graph div)
  const containerEl = navEl.parentElement;
  const containerRect = containerEl.getBoundingClientRect();
  // separator: dashed border-top div, sibling after the nav+graph container
  const allDivs = Array.from(document.querySelectorAll('div'));
  return {
    navBottom_navElement: navRect.bottom,
    navContainerBottom: containerRect.bottom,
    navElementHTML: navEl.outerHTML.slice(0, 100),
    containerTag: containerEl.tagName,
  };
});
console.log('NAV MEASUREMENTS', navMeasure);

const results = {};
for (const nodeId of ['about', 'portfolio', 'articles']) {
  // reload fresh each time to reset state
  await page.goto('http://localhost:5175/');
  await page.waitForTimeout(300);

  const input = await page.locator('input[type="text"]');
  await input.fill(nodeId);
  await input.press('Enter');
  await page.waitForTimeout(500); // allow animation + resize observer

  const data = await page.evaluate((id) => {
    const panel = document.querySelector('[style*="position: fixed"]'); // rough, will refine
    // Find the content panel: it's a motion.div with borderTop dashed and overflowY auto
    const candidates = Array.from(document.querySelectorAll('div')).filter(d => {
      const s = getComputedStyle(d);
      return s.position === 'fixed' && s.overflowY === 'auto';
    });
    const panelEl = candidates[0];
    const panelRect = panelEl ? panelEl.getBoundingClientRect() : null;
    const contentDiv = panelEl ? panelEl.firstElementChild : null;
    const contentHeight = contentDiv ? contentDiv.getBoundingClientRect().height : null;

    const navEl = document.querySelector('nav');
    const navRect = navEl.getBoundingClientRect();
    const containerRect = navEl.parentElement.getBoundingClientRect();

    const separators = Array.from(document.querySelectorAll('div')).filter(d => {
      const s = getComputedStyle(d);
      return s.borderTopStyle === 'dashed';
    });
    const separatorBottoms = separators.map(d => d.getBoundingClientRect().bottom);

    return {
      panelTop: panelRect ? panelRect.top : null,
      contentHeight,
      navListBottom: navRect.bottom,
      navContainerBottom: containerRect.bottom,
      separatorBottoms,
      windowH: window.innerHeight,
    };
  }, nodeId);

  results[nodeId] = data;
}

console.log('RESULTS', JSON.stringify(results, null, 2));

await browser.close();
