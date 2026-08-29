const SHEET_ID = "1cHvWmYFM-KW4hARsX5P2IuWSzeMGxzTa4fGoSLNIsk4";

const HOJAS = [
    "FAAC",
    "Centurion",
    "Merik",
    "Erreka",
    "Rossi",
    "Allmatic",
    "Azteca",
    "Controles",
    "Resortes",
    "Herrajes",
    "Centrales y tarjetas electronicas",
    "Dispositivos y accesorios electronicos",
    "Control de Acceso",
    "Refacciones"
];

// ================================
// CONFIGURACIÓN
// ================================

const CONFIG = {
    cacheMinutos: 5,
    debounceBusqueda: 250,
    carpetaImagenes: "Imagenes",
    extensionesImagen: ["png", "jpg", "jpeg", "webp"]
};

// ================================
// ESTADO
// ================================

let data = {};
let cargando = {};
let currentSheet = HOJAS[0];

const tabs = document.getElementById("tabs");
const products = document.getElementById("products");
const search = document.getElementById("search");

// ================================
// UTILIDADES
// ================================

/**
 * Normaliza texto:
 * - convierte a minúsculas
 * - elimina acentos
 * - elimina espacios innecesarios
 */
function normalizarTexto(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}

/**
 * Busca una propiedad sin importar:
 * - mayúsculas
 * - minúsculas
 * - acentos
 */
function obtenerValor(obj, posiblesNombres) {

    const claves = Object.keys(obj);

    for (const nombre of posiblesNombres) {

        const nombreNormalizado = normalizarTexto(nombre);

        const claveEncontrada = claves.find(
            clave => normalizarTexto(clave) === nombreNormalizado
        );

        if (claveEncontrada !== undefined) {
            return obj[claveEncontrada];
        }

    }

    return null;
}

/**
 * Convierte el precio a número.
 */
function convertirPrecio(valor) {

    if (valor === null || valor === undefined || valor === "") {
        return 0;
    }

    let texto = String(valor)
        .replace(/\$/g, "")
        .replace(/,/g, "")
        .trim();

    const numero = Number(texto);

    return Number.isFinite(numero)
        ? Math.round(numero)
        : 0;

}

/**
 * Escapa HTML para evitar problemas si los datos
 * de Google Sheets contienen caracteres especiales.
 */
function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

// ================================
// CACHE
// ================================

function obtenerCache(hoja) {

    const key = `sheet_${hoja}`;

    try {

        const cacheRaw = localStorage.getItem(key);

        if (!cacheRaw) {
            return null;
        }

        const cache = JSON.parse(cacheRaw);

        const tiempoCache =
            Date.now() - cache.timestamp;

        const cacheValido =
            tiempoCache <
            CONFIG.cacheMinutos * 60 * 1000;

        if (!cacheValido) {

            localStorage.removeItem(key);

            return null;

        }

        return cache.data;

    } catch (error) {

        console.warn(
            `Error leyendo cache de ${hoja}:`,
            error
        );

        return null;

    }

}

function guardarCache(hoja, datos) {

    const key = `sheet_${hoja}`;

    try {

        localStorage.setItem(
            key,
            JSON.stringify({
                data: datos,
                timestamp: Date.now()
            })
        );

    } catch (error) {

        console.warn(
            `No se pudo guardar cache de ${hoja}:`,
            error
        );

    }

}

// ================================
// FETCH GOOGLE SHEETS
// ================================

async function fetchHoja(hoja) {

    const cache = obtenerCache(hoja);

    if (cache) {
        return cache;
    }

    const url =
        `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(hoja)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Error HTTP ${response.status}`
        );
    }

    const json = await response.json();

    if (!Array.isArray(json)) {
        throw new Error(
            "La respuesta de Google Sheets no es válida."
        );
    }

    guardarCache(hoja, json);

    return json;

}

// ================================
// CARGAR HOJA
// ================================

async function cargarHoja(hoja) {

    // Ya está cargada
    if (data[hoja]) {
        return data[hoja];
    }

    // Ya se está cargando
    if (cargando[hoja]) {
        return cargando[hoja];
    }

    cargando[hoja] = fetchHoja(hoja)
        .then(datos => {

            data[hoja] = datos;

            return datos;

        })
        .catch(error => {

            console.error(
                `Error cargando ${hoja}:`,
                error
            );

            data[hoja] = [];

            return [];

        })
        .finally(() => {

            delete cargando[hoja];

        });

    return cargando[hoja];

}

// ================================
// TABS
// ================================

function renderTabs() {

    tabs.innerHTML = "";

    const fragment =
        document.createDocumentFragment();

    HOJAS.forEach(hoja => {

        const btn =
            document.createElement("button");

        btn.className =
            `tab ${hoja === currentSheet ? "active" : ""}`;

        btn.textContent = hoja;

        btn.type = "button";

        btn.addEventListener("click", async () => {

            if (currentSheet === hoja) {
                return;
            }

            currentSheet = hoja;

            renderTabs();

            if (!data[hoja]) {

                mostrarCarga();

            }

            await cargarHoja(hoja);

            renderProducts();

        });

        fragment.appendChild(btn);

    });

    tabs.appendChild(fragment);

}

// ================================
// LOADING
// ================================

function mostrarCarga() {

    products.innerHTML = `
        <div class="loading">
            <span class="loader"></span>
            <p>Cargando productos...</p>
        </div>
    `;

}

// ================================
// PRODUCTOS
// ================================

function prepararProducto(producto) {

    const descripcion =
        obtenerValor(producto, [
            "Descripcion",
            "Descripción"
        ]);

    if (!descripcion) {
        return null;
    }

    const inventario =
        obtenerValor(producto, [
            "Inventario"
        ]) || 0;

    const precioRaw =
        obtenerValor(producto, [
            "Precio"
        ]) || 0;

    return {

        descripcion: String(descripcion).trim(),

        descripcionBusqueda:
            normalizarTexto(descripcion),

        inventario,

        precio:
            convertirPrecio(precioRaw)

    };

}

// ================================
// RENDER PRODUCTS
// ================================

function renderProducts() {

    const productos =
        data[currentSheet] || [];

    const termino =
        normalizarTexto(search.value);

    const filtrados =
        productos

            .map(prepararProducto)

            .filter(Boolean)

            .filter(producto => {

                if (!termino) {
                    return true;
                }

                return producto.descripcionBusqueda
                    .includes(termino);

            });

    products.innerHTML = "";

    if (filtrados.length === 0) {

        products.innerHTML = `
            <div class="card empty">
                <h3>No se encontraron productos</h3>
                <p>Intenta con otro término de búsqueda.</p>
            </div>
        `;

        return;

    }

    const fragment =
        document.createDocumentFragment();

    filtrados.forEach(producto => {

        const card =
            document.createElement("article");

        card.className = "card";

        const titulo =
            document.createElement("h3");

        titulo.textContent =
            producto.descripcion;

        const content =
            document.createElement("div");

        content.className =
            "card-content";

        const info =
            document.createElement("div");

        info.className =
            "card-info";

        info.innerHTML = `
            <p>
                <strong>Inventario:</strong>
                ${escaparHTML(producto.inventario)}
            </p>

            <p class="precio">
                <strong>Precio:</strong>
                $${producto.precio.toLocaleString("es-MX")}
            </p>
        `;

        const imagen =
            document.createElement("img");

        imagen.className =
            "product-image";

        imagen.alt =
            producto.descripcion;

        imagen.loading = "lazy";

        imagen.decoding = "async";

        const nombreImagen =
            encodeURIComponent(
                producto.descripcion
            );

        imagen.src =
            `${CONFIG.carpetaImagenes}/${nombreImagen}.png`;

        imagen.onerror = () => {

            imagen.style.display = "none";

        };

        content.appendChild(info);
        content.appendChild(imagen);

        card.appendChild(titulo);
        card.appendChild(content);

        fragment.appendChild(card);

    });

    products.appendChild(fragment);

}

// ================================
// BÚSQUEDA
// ================================

let debounceTimer = null;

search.addEventListener("input", () => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {

        renderProducts();

    }, CONFIG.debounceBusqueda);

});

// ================================
// INICIALIZACIÓN
// ================================

async function iniciar() {

    mostrarCarga();

    renderTabs();

    await cargarHoja(currentSheet);

    renderProducts();

    // Precargar las demás hojas después de mostrar
    // la primera para que los siguientes clicks sean rápidos.
    setTimeout(() => {

        HOJAS
            .filter(hoja => hoja !== currentSheet)
            .forEach(hoja => {

                cargarHoja(hoja);

            });

    }, 1000);

}

iniciar();