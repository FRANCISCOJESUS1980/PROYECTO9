const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const siteConfigurations = {
  amazon: {
    nameSelector: '.p13n-sc-truncate-desktop-type2  .p13n-sc-truncated',
    priceSelector: '._cDEzb_p13n-sc-price_3mJ9Z"',
    imageSelector: '.a-dynamic-image p13n-sc-dynamic-image .p13n-product-image',
    nextPageSelector: '.pagination-siguiente'
  },
  pccomponentes: {
    nameSelector: '.GTM-productClick.enlace-disimulado',
    priceSelector: '.precio-total',
    imageSelector: 'img.img-responsive',
    nextPageSelector: '.pagination-siguiente'
  },
  mediamarkt: {
    nameSelector: '.product-title',
    priceSelector: '.price-wrapper',
    imageSelector: 'img.product-image',
    nextPageSelector: '.pagination-next'
  },
  tien21: {
    nameSelector: '.product-item-title',
    priceSelector: '.product-item-price',
    imageSelector: '.product-item-img img',
    nextPageSelector: '.next'
  }
}

const scrapePage = async (page, url, config) => {
  await page.goto(url, { waitUntil: 'load', timeout: 0 })

  await page.evaluate(() => {
    const modal = document.querySelector('.modal-class')
    if (modal) modal.remove()
  })

  const products = await page.evaluate((config) => {
    const productList = []
    document.querySelectorAll(config.productItemSelector).forEach((product) => {
      const name = product.querySelector(config.nameSelector)?.innerText
      const price = product.querySelector(config.priceSelector)?.innerText
      const image = product.querySelector(config.imageSelector)?.src

      if (name && price && image) {
        productList.push({
          name,
          price,
          image
        })
      }
    })
    return productList
  }, config)

  return products
}

const scrapeWebsite = async (urls, siteConfigs) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  let allProducts = []

  for (const [site, url] of Object.entries(urls)) {
    const config = siteConfigs[site]
    console.log(`Scraping URL: ${url} (sitio: ${site})`)

    let hasNextPage = true
    let currentPage = 1

    while (hasNextPage) {
      const fullUrl = `${url}?page=${currentPage}`
      const products = await scrapePage(page, fullUrl, config)
      allProducts = allProducts.concat(products)

      console.log(
        `Página ${currentPage} scrapeada para ${site}. Productos obtenidos: ${products.length}`
      )

      hasNextPage = await page.evaluate((config) => {
        const nextButton = document.querySelector(config.nextPageSelector)
        return nextButton !== null && !nextButton.classList.contains('disabled')
      }, config)

      currentPage++
    }
  }

  await browser.close()

  const filePath = path.join(__dirname, '../public/products.json')
  fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2), 'utf-8')

  console.log(`Scraping completado. Productos guardados en ${filePath}`)
}

const urlsToScrape = {
  amazon: 'https://www.amazon.es/gp/bestsellers/?ref_=nav_cs_bestsellers',
  pccomponentes: 'https://www.pccomponentes.com/buscar?q=portatiles',
  mediamarkt:
    'https://www.mediamarkt.es/es/category/electrodom%C3%A9sticos-553.html',
  tien21: 'https://www.tien21.es/electrodomesticos'
}

scrapeWebsite(urlsToScrape, siteConfigurations)
