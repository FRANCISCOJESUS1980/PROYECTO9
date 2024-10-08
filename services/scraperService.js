const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const closeModalIfExists = async (page) => {
  const modalSelectors = [
    '.modal-close-button',
    '.popup-close',
    '.cookie-consent-close',
    '.close-modal',
    '[aria-label="Close"]',
    '.btn-close',
    '.close',
    '.cn_content_close-9fe27e64-7693-4af0-aaa3-24635005916e'
  ]

  for (const selector of modalSelectors) {
    let isModalOpen = true

    while (isModalOpen) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })

        await page.click(selector)
        console.log(`Modal cerrado con selector: ${selector}`)
      } catch (error) {
        console.log(`No se encontró modal con el selector: ${selector}`)
        isModalOpen = false
      }
    }
  }
}

const retrySelector = async (page, selector, retries = 3, timeout = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout })
      return true
    } catch (error) {
      console.warn(
        `Reintento ${i + 1}/${retries} fallido para el selector: ${selector}`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return false
}

const siteConfigurations = {
  worten: {
    productItemSelector: '.product-card__text-container',
    nameSelector: '.produc-card__name__link',
    priceSelector: '.price__container .value',
    imageSelector: 'img',
    nextPageSelector: '.numbers-pagination .listing-content__numbers-pagination'
  },
  electrocosto: {
    productItemSelector: 'li article',
    nameSelector: 'article h2',
    priceSelector: '.x-currency',
    imageSelector: 'img',
    nextPageSelector: '.pagination-next a'
  },
  tien21: {
    productItemSelector: '.c-product-list-list__item',
    nameSelector: 'h2 a',
    priceSelector: 'span .c-product-list-list__item-footer-price',
    imageSelector: 'img',
    nextPageSelector: '.pagination-next a'
  }
}

const scrapePage = async (page, url, config) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 })

    if (!(await retrySelector(page, config.productItemSelector))) {
      console.error('No se encontró el selector de productos en la página.')
      return []
    }

    const products = await page.evaluate((config) => {
      const productList = []
      document
        .querySelectorAll(config.productItemSelector)
        .forEach((product) => {
          const name =
            product.querySelector(config.nameSelector)?.innerText ||
            'Nombre no disponible'
          const price =
            product.querySelector(config.priceSelector)?.innerText ||
            'Precio no disponible'
          const image =
            product.querySelector(config.imageSelector)?.src ||
            'Imagen no disponible'

          if (name && price && image) {
            productList.push({ name, price, image })
          }
        })
      return productList
    }, config)

    return products
  } catch (error) {
    console.error(`Error en el scraping de ${url}: `, error.message)
    return []
  }
}

const scrapeWebsite = async (urls, siteConfigs) => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  let allProducts = []

  for (const [site, url] of Object.entries(urls)) {
    const config = siteConfigs[site]
    console.log(`Scraping URL: ${url} (sitio: ${site})`)

    let hasNextPage = true
    let currentPageUrl = url

    while (hasNextPage) {
      console.log(`Scrapeando página ${currentPageUrl} en ${site}`)

      const products = await scrapePage(page, currentPageUrl, config)
      allProducts = allProducts.concat(products)

      if (products.length === 0) {
        console.log(
          `No se encontraron productos en la página. Deteniendo el scraping para ${site}.`
        )
        break
      }

      console.log(
        `Página scrapeada para ${site}. Productos obtenidos: ${products.length}`
      )

      const nextPageUrl = await page.evaluate((config) => {
        const nextButton = document.querySelector(config.nextPageSelector)
        return nextButton
          ? nextButton.href || nextButton.getAttribute('href')
          : null
      }, config)

      if (nextPageUrl) {
        currentPageUrl = nextPageUrl
        try {
          console.log(`Avanzando a la siguiente página...`)

          await page.goto(currentPageUrl, {
            waitUntil: 'networkidle2',
            timeout: 90000
          })

          await page.waitForSelector(config.productItemSelector, {
            timeout: 10000
          })
        } catch (error) {
          console.error(
            'Error al navegar a la siguiente página:',
            error.message
          )
          hasNextPage = false
        }
      } else {
        console.log('No hay más páginas.')
        hasNextPage = false
      }
    }
  }
  await browser.close()

  const filePath = path.join(__dirname, '../public/products.json')
  fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2), 'utf-8')
  console.log(`Scraping completado. Productos guardados en ${filePath}`)
}

const urlsToScrape = {
  worten:
    'https://www.worten.es/productos/electrodomesticos/lavado-y-cuidado-de-la-ropa/lavadoras',
  electrocosto:
    'https://www.electrocosto.com/?srsltid=AfmBOopcwIJdckQyDPBvqZJKamNt7z_kGL0HEmGar9SWnoi1wGM5tWtl&query=lavadoras',
  tien21: 'https://www.tien21.es/imagen/tv.html'
}

scrapeWebsite(urlsToScrape, siteConfigurations, closeModalIfExists)
