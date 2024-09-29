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
    nameSelector: 'h3 a',
    priceSelector: '.ecode_product_price',
    imageSelector: 'article figure img',
    nextPageSelector: '.ecode_products_pagination'
  },
  worten: {
    productItemSelector: '.product-card__text-container',
    nameSelector: '.produc-card__name__link',
    priceSelector: '.price__container',
    imageSelector: '.product-card__image',
    nextPageSelector: '.numbers-pagination .listing-content__numbers-pagination'
  },
  electrocosto: {
    productItemSelector: '.recomender-block-item',
    nameSelector: '.x-small x-ellipsis .x-margin--top-02',
    priceSelector: '.x-currency',
    imageSelector: '.x-result-picture-image .x-picture-image',
    nextPageSelector: '.pagination-next a'
  },
  tien21: {
    productItemSelector: '.c-product-list-list__item',
    nameSelector: '.product-name',
    priceSelector: '.price',
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

      hasNextPage = await page.evaluate((config) => {
        const nextButton = document.querySelector(config.nextPageSelector)
        if (nextButton) {
          return nextButton.href || nextButton.getAttribute('href')
        }
        return null
      }, config)

      if (hasNextPage) {
        currentPageUrl = hasNextPage
        try {
          console.log(`Avanzando a la siguiente página (${currentPageUrl})...`)
          await page.goto(currentPageUrl, {
            waitUntil: 'networkidle2',
            timeout: 90000
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
      }
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
    'https://www.electrocosto.com/?srsltid=AfmBOopcwIJdckQyDPBvqZJKamNt7z_kGL0HEmGar9SWnoi1wGM5tWtl&query=lavadoras',
  tien21: 'https://www.tien21.es/imagen/tv.html'
}

scrapeWebsite(urlsToScrape, siteConfigurations, closeModalIfExists)
