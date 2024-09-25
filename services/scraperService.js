const puppeteer = require('puppeteer')
const fs = require('fs')
const { logger } = require('../utils/logger')

async function scrapeWebsite() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const allProducts = []
  const urls = [
    'https://www.amazon.es/gp/bestsellers/?ref_=nav_cs_bestsellers',
    'https://www.pccomponentes.com/?s_kwcid=AL!14405!3!600262053045!e!!g!!pc%20componentes&gad_source=1&gclid=CjwKCAjw6c63BhAiEiwAF0EH1BVyKRQBXpOgp9DayqdSEfCdtdvulikeH_yra8NZ-aRiQYc6_6ySZRoCDNYQAvD_BwE',
    'https://www.mediamarkt.es/es/category/electrodom%C3%A9sticos-553.html',
    'https://www.tien21.es/?srsltid=AfmBOooRB0-EeL9URaSmNYOTHkMkZ7ihZBnfJbWLYvzHgFRYx-dz9s-M'
  ]

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle2' })

    let productsOnPage = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product')).map(
        (product) => ({
          name: product.querySelector('.product-name').textContent,
          price: product.querySelector('.product-price').textContent,
          image: product.querySelector('.product-image img').src
        })
      )
    })

    allProducts.push(...productsOnPage)
  }

  await browser.close()
  return allProducts
}

async function scrapeAndSave() {
  try {
    const products = await scrapeWebsite()
    fs.writeFileSync(
      './public/products.json',
      JSON.stringify(products, null, 2)
    )
    logger.info('Scraping completado y datos guardados en products.json')
  } catch (error) {
    logger.error('Error durante el scraping:', error)
  }
}

module.exports = { scrapeAndSave }
