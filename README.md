Proyecto de Web Scraping - Electrodomésticos

Este proyecto tiene como objetivo realizar el scraping de sitios web de electrodomésticos para obtener datos como nombres de productos, precios e imágenes. Utiliza Puppeteer, una herramienta de automatización de navegador basada en Node.js, que permite navegar por páginas web, extraer información, hacer clic en elementos, y navegar entre diferentes páginas.

Tabla de Contenidos
Requisitos
Instalación
Ejecución del Proyecto
Descripción del Código
Cómo Funciona el Scraping
Configuración de Sitios
Manejo de Modales
Manejo de Paginación
Guardado de Productos
Mejoras Futuras
Requisitos
Node.js (versión 14 o superior)
npm o yarn (para instalar dependencias)
Internet (para acceder a los sitios web a scrapear)

Instalación
Primero, asegúrate de tener Node.js y npm instalados en tu sistema. Si no los tienes, puedes descargarlos aquí.

Clona el repositorio
bash
Copiar código
git clone https://github.com/tu-usuario/proyecto-scraping.git
cd proyecto-scraping
Instala las dependencias
Instala las dependencias necesarias utilizando npm o yarn:

bash
Copiar código
npm install
O si usas yarn:

bash
Copiar código
yarn install
Esto instalará Puppeteer y otras dependencias necesarias.

Ejecución del Proyecto
Para ejecutar el proyecto y comenzar el scraping, simplemente utiliza el siguiente comando:

bash
Copiar código
npm run scrape
Esto lanzará Puppeteer, abrirá el navegador y comenzará a scrapear las URLs configuradas en el archivo scraperService.js.

Descripción del Código
El código principal de scraping se encuentra en el archivo scraperService.js. A continuación, se explican las secciones clave del archivo:

1. Configuración de Sitios Web (siteConfigurations)
   Este objeto contiene la configuración específica para cada sitio que se quiere scrapear. Define los selectores para obtener los productos, nombres, precios, imágenes y paginación.

javascript
Copiar código
const siteConfigurations = {
lacasadelelectrodomestico: {
productItemSelector: '.ecode_product_list',
nameSelector: '.ecode_product_images_tags',
priceSelector: '.ecode_product_price',
imageSelector: '.ecode_product_image ecode_false_link',
nextPageSelector: '.ecode_pagination'
},
// Otras configuraciones de sitios...
}

2. Scraping de Páginas (scrapePage)
   La función scrapePage se encarga de visitar la página, esperar a que los productos estén cargados, extraer la información de cada producto y devolverla como un array.

javascript
Copiar código
const scrapePage = async (page, url, config) => {
try {
await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    if (!(await retrySelector(page, config.productItemSelector))) {
      console.error('No se encontró el selector de productos en la página.');
      return [];
    }

    const products = await page.evaluate((config) => {
      const productList = [];
      document
        .querySelectorAll(config.productItemSelector)
        .forEach((product) => {
          const name =
            product.querySelector(config.nameSelector)?.innerText ||
            'Nombre no disponible';
          const price =
            product.querySelector(config.priceSelector)?.innerText ||
            'Precio no disponible';
          const image =
            product.querySelector(config.imageSelector)?.src ||
            'Imagen no disponible';

          if (name && price && image) {
            productList.push({ name, price, image });
          }
        });
      return productList;
    }, config);

    return products;

} catch (error) {
console.error(`Error en el scraping de ${url}: `, error.message);
return [];
}
}; 3. Navegación entre Páginas
Para pasar a la siguiente página, el código utiliza la función page.evaluate para encontrar el botón de la siguiente página (nextPageSelector). Después de encontrar el enlace, el scraper navega a la siguiente página.

javascript
Copiar código
hasNextPage = await page.evaluate((config) => {
const nextButton = document.querySelector(config.nextPageSelector);
return nextButton ? nextButton.href || nextButton.getAttribute('href') : null;
}, config);
Cómo Funciona el Scraping
El scraping de este proyecto se basa en Navegar y Extraer:

Navega a una página web específica.
Espera a que los elementos de la página estén disponibles.
Extrae la información relevante (nombre, precio, imagen) usando los selectores CSS.
Guarda los datos obtenidos en un archivo JSON.
Secuencia de Ejecución
Navegación inicial: El script navega a la URL proporcionada para cada tienda.
Extracción de productos: Usa los selectores configurados para extraer información.
Paginación: Al terminar de scrapear una página, verifica si hay una página siguiente. Si existe, navega a ella y repite el proceso.
Finalización: Cuando no hay más páginas disponibles, el proceso de scraping se detiene y los productos se guardan en un archivo JSON.
Configuración de Sitios
Cada tienda online tiene una configuración diferente en el objeto siteConfigurations. En él se definen:

productItemSelector: Selector CSS del contenedor principal de los productos.
nameSelector: Selector del nombre del producto.
priceSelector: Selector del precio del producto.
imageSelector: Selector de la imagen del producto.
nextPageSelector: Selector del botón o enlace para pasar a la siguiente página.
Puedes añadir más tiendas fácilmente agregando nuevas configuraciones en el objeto siteConfigurations.

Manejo de Modales
La función closeModalIfExists está diseñada para cerrar cualquier ventana emergente (modal) que pueda aparecer durante el scraping. Busca una serie de selectores comunes para detectar y cerrar modales automáticamente.

javascript
Copiar código
const closeModalIfExists = async (page) => {
const modalSelectors = [
'.modal-close-button',
'.popup-close',
'.cookie-consent-close',
'.close-modal',
'[aria-label="Close"]',
'.btn-close',
'.close'
];

for (const selector of modalSelectors) {
let isModalOpen = true;

    while (isModalOpen) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        console.log(`Modal cerrado con selector: ${selector}`);
      } catch (error) {
        console.log(`No se encontró modal con el selector: ${selector}`);
        isModalOpen = false;
      }
    }

}
};
Esta función se ejecuta antes de cada navegación en cada página para garantizar que no haya modales bloqueando el proceso.

Manejo de Paginación
El código es capaz de detectar y hacer clic en el botón de paginación para pasar a la siguiente página. Si no se encuentra el botón de paginación o el enlace, el scraping se detiene.

javascript
Copiar código
hasNextPage = await page.evaluate((config) => {
const nextButton = document.querySelector(config.nextPageSelector);
return nextButton ? nextButton.href || nextButton.getAttribute('href') : null;
}, config);
Guardado de Productos
Los productos extraídos de las diferentes tiendas se guardan en un archivo JSON. Al final del proceso de scraping, todos los productos se consolidan y se guardan en un archivo products.json.

javascript
Copiar código
const filePath = path.join(\_\_dirname, '../public/products.json');
fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2), 'utf-8');
console.log(`Scraping completado. Productos guardados en ${filePath}`);
Mejoras Futuras
Detección de errores y reintentos automáticos: Implementar más robustez en la navegación entre páginas en caso de que una página falle al cargar.
Scraping concurrente: Ejecutar el scraping en varias páginas o sitios de forma concurrente para aumentar la velocidad.
Mejoras en la detección de modales: Agregar más selectores para cerrar una mayor variedad de modales, especialmente los específicos de cada sitio.
Detección dinámica de elementos: Mejorar el reconocimiento de selectores dinámicos, haciendo que el scraper sea más resiliente a cambios en las páginas web.

creado por FRANCISCO JESUS GONZALEZ VERGARA
