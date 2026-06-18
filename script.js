const API_BASE = "https://sheetdb.io/api/v1/99hgxwlphqjm8";

const HOJAS = [
    "FAAC",
    "Centurion",
    "Erreka",
    "ROSSI"
];

const TIPO_CAMBIO = 18;
const MARGEN = 1.22;

let data = {};
let currentSheet = HOJAS[0];

const tabs = document.getElementById('tabs');
const products = document.getElementById('products');
const search = document.getElementById('search');

async function cargarDatos() {

    for (const hoja of HOJAS) {

        try {

            const response = await fetch(
                `${API_BASE}?sheet=${encodeURIComponent(hoja)}`
            );

            data[hoja] = await response.json();

        } catch (error) {

            console.error(`Error cargando ${hoja}`, error);
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
                producto["Descripción"] ||
                producto["DESCRIPCIÓN"] ||
                producto["Descripcion"] ||
                producto["DESCRIPCION"];

            if (!descripcion) return false;

            return descripcion
                .toLowerCase()
                .includes(term);

        })

        .forEach(producto => {

            const descripcion =
                producto["Descripción"] ||
                producto["DESCRIPCIÓN"] ||
                producto["Descripcion"] ||
                producto["DESCRIPCION"];

            let inventario;
            let precioUSD;

            if (currentSheet === "FAAC Piezas Únicas") {

                inventario =
                    producto["Existencia"] ||
                    producto["EXISTENCIA"] ||
                    0;

                precioUSD =
                    producto["Precios"] ||
                    producto["PRECIOS"] ||
                    0;

            } else {

                inventario =
                    producto["Inventario"] ||
                    producto["INVENTARIO"] ||
                    0;

                precioUSD =
                    producto["Precio"] ||
                    producto["PRECIO"] ||
                    0;

            }

            precioUSD =
                Number(
                    String(precioUSD)
                        .replace("$", "")
                        .replace(",", "")
                ) || 0;

            const precioMXN = Math.round(
                precioUSD *
                MARGEN *
                TIPO_CAMBIO
            );

            const card = document.createElement('div');

            card.className = 'card';

            card.innerHTML = `
                <h3>${descripcion}</h3>

                <p>
                    <b>Inventario:</b>
                    ${inventario}
                </p>

                <p>
                    <b>Precio:</b>
                    $${precioMXN.toLocaleString('es-MX')}
                </p>
            `;

            products.appendChild(card);

        });
}

search.addEventListener('input', renderProducts);

cargarDatos();
