const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const closeModalIfExists = async (page) => {
  try {
    const modalSelector = '.modal-close-button'
    await page.waitForSelector(modalSelector, { timeout: 5000 })
    await page.click(modalSelector)
    console.log('Modal cerrado')
  } catch (error) {
    console.log('No se encontró ningún modal')
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
  lacasadelelectrodomestico: {
    productItemSelector: '.ecode_product_list',
    nameSelector: '.ecode_product_images_tags',
    priceSelector: '.ecode_product_price',
    imageSelector: '.ecode_product_image ecode_false_link',
    nextPageSelector: '.a-pagination .a-last'
  },
  worten: {
    productItemSelector: '.product-card__text-container',
    nameSelector: '.produc-card__name__link',
    priceSelector: '.price__container',
    imageSelector: '.product-card__image',
    nextPageSelector: '.pagination-next'
  },
  electrocosto: {
    productItemSelector: '.recomender-block-item',
    nameSelector: '.precomender-block-item-title',
    priceSelector: '.recomender-block-item-price',
    imageSelector: '.product-image img',
    nextPageSelector: '.pagination-next'
  },
  tien21: {
    productItemSelector: '.c-product-list-list__item',
    nameSelector: '.product-name',
    priceSelector: '.price',
    imageSelector: 'img',
    nextPageSelector: '.pagination-next'
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
    let currentPage = 1

    while (hasNextPage) {
      const fullUrl = `${url}?page=${currentPage}`
      console.log(`Scrapeando página ${currentPage} en ${site}`)

      const products = await scrapePage(page, fullUrl, config)
      allProducts = allProducts.concat(products)

      console.log(
        `Página ${currentPage} scrapeada para ${site}. Productos obtenidos: ${products.length}`
      )

      hasNextPage = await page.evaluate((config) => {
        const nextButton = document.querySelector(config.nextPageSelector)
        return nextButton && !nextButton.classList.contains('disabled')
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
  lacasadelelectrodomestico:
    'https://www.lacasadelelectrodomestico.com/Seccion~x~Lavado-y-secado~IDSeccion~74.html',
  worten:
    'https://www.worten.es/productos/electrodomesticos/lavado-y-cuidado-de-la-ropa/lavadoras',
  electrocosto:
    'https://www.electrocosto.com/?srsltid=AfmBOopcwIJdckQyDPBvqZJKamNt7z_kGL0HEmGar9SWnoi1wGM5tWtl',
  tien21: 'https://www.tien21.es/imagen/tv.html'
}

scrapeWebsite(urlsToScrape, siteConfigurations, closeModalIfExists)
