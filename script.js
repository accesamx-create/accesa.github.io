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
    "Comunello",
    "Electronica",
    "Extras"
];

let data = {};
let currentSheet = HOJAS[0];

const tabs = document.getElementById("tabs");
const products = document.getElementById("products");
const search = document.getElementById("search");

async function cargarDatos() {

    products.innerHTML = "<p style='color:white;'>Cargando productos...</p>";

    for (const hoja of HOJAS) {

        try {

            const response = await fetch(
                `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(hoja)}`
            );

            data[hoja] = await response.json();

        } catch (error) {

            console.error(`Error cargando ${hoja}:`, error);
            data[hoja] = [];

        }
    }

    renderTabs();
    renderProducts();
}

function renderTabs() {

    tabs.innerHTML = "";

    HOJAS.forEach(sheet => {

        const btn = document.createElement("div");

        btn.className =
            "tab" +
            (sheet === currentSheet ? " active" : "");

        btn.textContent = sheet;

        btn.onclick = () => {

            currentSheet = sheet;

            renderTabs();
            renderProducts();

        };

        tabs.appendChild(btn);

    });
}

function obtenerValor(obj, posiblesNombres) {

    for (const nombre of posiblesNombres) {

        if (obj[nombre] !== undefined) {
            return obj[nombre];
        }

    }

    return null;
}

function renderProducts() {

    const term = search.value.toLowerCase();

    products.innerHTML = "";

    (data[currentSheet] || [])

        .filter(producto => {

            const descripcion = obtenerValor(
                producto,
                [
                    "Descripcion",
                    "Descripción",
                    "DESCRIPCION",
                    "DESCRIPCIÓN"
                ]
            );

            if (!descripcion) return false;

            return descripcion
                .toLowerCase()
                .includes(term);

        })

        .forEach(producto => {

            const descripcion = obtenerValor(
                producto,
                [
                    "Descripcion",
                    "Descripción",
                    "DESCRIPCION",
                    "DESCRIPCIÓN"
                ]
            );

            const inventario =
                obtenerValor(
                    producto,
                    [
                        "Inventario",
                        "INVENTARIO"
                    ]
                ) || 0;

            const precioRaw =
                obtenerValor(
                    producto,
                    [
                        "Precio",
                        "PRECIO"
                    ]
                ) || 0;

            const imagen =
                obtenerValor(
                    producto,
                    [
                        "Imagen",
                        "IMAGEN"
                    ]
                ) || "no-image.png";

            const precio = Math.round(
                Number(
                    String(precioRaw)
                        .replace(/\$/g, "")
                        .replace(/,/g, "")
                ) || 0
            );

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `

                <img
                    src="images/${imagen}"
                    class="product-image"
                    alt="${descripcion}"
                    onerror="this.src='images/no-image.png'"
                >

                <h3>${descripcion}</h3>

                <p>
                    <strong>Inventario:</strong>
                    ${inventario}
                </p>

                <p class="precio">
                    $${precio.toLocaleString("es-MX")}
                </p>

            `;

            products.appendChild(card);

        });

    if (products.innerHTML === "") {

        products.innerHTML = `
            <div class="card">
                <h3>No se encontraron productos</h3>
            </div>
        `;

    }
}

search.addEventListener("input", renderProducts);

cargarDatos();
