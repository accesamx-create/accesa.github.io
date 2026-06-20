const API_BASE = "https://sheetdb.io/api/v1/99hgxwlphqjm8";

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
    "Comunello",
    "Electronica"
];

let data = {};
let currentSheet = HOJAS[0];

const tabs = document.getElementById('tabs');
const products = document.getElementById('products');
const search = document.getElementById('search');

async function cargarDatos() {

    products.innerHTML = "<p>Cargando productos...</p>";

    for (const hoja of HOJAS) {

        try {

            const response = await fetch(
                `${API_BASE}?sheet=${encodeURIComponent(hoja)}`
            );

            const json = await response.json();

            data[hoja] = json;

        } catch (error) {

            console.error(`Error cargando ${hoja}:`, error);

            data[hoja] = [];

        }
    }

    renderTabs();
    renderProducts();
}

function renderTabs() {

    tabs.innerHTML = '';

    HOJAS.forEach(sheet => {

        const btn = document.createElement('div');

        btn.className =
            'tab' +
            (sheet === currentSheet ? ' active' : '');

        btn.textContent = sheet;

        btn.onclick = () => {

            currentSheet = sheet;

            renderTabs();
            renderProducts();

        };

        tabs.appendChild(btn);

    });
}

function renderProducts() {

    const term = search.value.toLowerCase();

    products.innerHTML = '';

    (data[currentSheet] || [])

        .filter(producto => {

            const descripcion =
                producto.Descripcion ||
                producto.DESCRIPCION ||
                producto.Descripción ||
                producto.DESCRIPCIÓN ||
                "";

            if (!descripcion) return false;

            if (
                descripcion.toLowerCase() === "null" ||
                descripcion.trim() === ""
            ) {
                return false;
            }

            return descripcion
                .toLowerCase()
                .includes(term);

        })

        .forEach(producto => {

            const descripcion =
                producto.Descripcion ||
                producto.DESCRIPCION ||
                producto.Descripción ||
                producto.DESCRIPCIÓN ||
                "";

            const inventario =
                producto.Inventario ||
                producto.INVENTARIO ||
                0;

            const precioRaw =
                producto.Precio ||
                producto.PRECIO ||
                0;

            const precio = Math.round(
                Number(
                    String(precioRaw)
                        .replace(/\$/g, '')
                        .replace(/,/g, '')
                ) || 0
            );

            const card = document.createElement('div');

            card.className = 'card';

            card.innerHTML = `
                <h3>${descripcion}</h3>

                <p>
                    <strong>Inventario:</strong>
                    ${inventario}
                </p>

                <p>
                    <strong>Precio:</strong>
                    $${precio.toLocaleString('es-MX')}
                </p>
            `;

            products.appendChild(card);

        });

    if (products.innerHTML === '') {

        products.innerHTML = `
            <div class="card">
                <h3>No se encontraron productos</h3>
            </div>
        `;

    }
}

search.addEventListener('input', renderProducts);

cargarDatos();
