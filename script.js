let data = {};
let currentSheet = '';

fetch('productos.json')
.then(r => r.json())
.then(json => {
    data = json;
    currentSheet = Object.keys(data)[0];
    renderTabs();
    renderProducts();
});

const tabs = document.getElementById('tabs');
const products = document.getElementById('products');
const search = document.getElementById('search');

function renderTabs() {
    tabs.innerHTML = '';

    Object.keys(data).forEach(sheet => {
        const b = document.createElement('div');

        b.className = 'tab' + (sheet === currentSheet ? ' active' : '');
        b.textContent = sheet;

        b.onclick = () => {
            currentSheet = sheet;
            renderTabs();
            renderProducts();
        };

        tabs.appendChild(b);
    });
}

function renderProducts() {
    const term = search.value.toLowerCase();

    products.innerHTML = '';

    (data[currentSheet] || [])
        .filter(p => {

            // Ignorar registros vacíos o null
            if (!p.descripcion) return false;
            if (String(p.descripcion).toLowerCase() === 'null') return false;
            if (p.precio == null) return false;

            return p.descripcion.toLowerCase().includes(term);
        })
        .forEach(p => {

            const precioBase = Number(p.precio) || 0;

            // USD × 1.22 × 18
            const precioFinal = Math.round(precioBase * 1.22 * 17.20);

            const card = document.createElement('div');
            card.className = 'card';

            card.innerHTML = `
                <h3>${p.descripcion}</h3>
                <p><b>Inventario:</b> ${p.inventario ?? ''}</p>
                <p><b>Precio:</b> $${precioFinal.toLocaleString('es-MX')}</p>
            `;

            products.appendChild(card);
        });
}

search.addEventListener('input', renderProducts);
