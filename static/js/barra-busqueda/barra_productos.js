document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const productosTable = document.getElementById('productosTable').getElementsByTagName('tbody')[0];
    const paginationContainer = document.getElementById('pagination');

    const itemsPerPage = 5;
    let currentPage = 1;
    let productos = [];

    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        filterProducts(searchInput.value);
    });

    function filterProducts(query) {
        const filteredProducts = productos.filter(product =>
            product.nombre.toLowerCase().includes(query.toLowerCase()) ||
            product.descripcion.toLowerCase().includes(query.toLowerCase()) ||
            product.precio.toString().includes(query) ||
            (product.categoriaNombre && product.categoriaNombre.toLowerCase().includes(query.toLowerCase())) ||
            (product.tallas_stock && product.tallas_stock.toLowerCase().includes(query.toLowerCase()))
        );
        renderProducts(filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        renderPagination(filteredProducts.length);
    }
    
    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .badge-info-custom {
                background-color: #6c757d; /* Azul claro */
                color: #0a0a0a; /* Texto blanco */
                font-size: 1.25rem; /* Tamaño de fuente más grande */
                padding: 0.5rem 1rem; /* Aumentar el padding */
                border-radius: 0.5rem; /* Redondear los bordes */
                margin-right: 0.5rem; /* Espacio entre badges */
            }
    
            .badge-secondary-custom {
                background-color: #6c757d; /* Gris oscuro */
                color: #ffffff; /* Texto blanco */
                font-size: 1.25rem; /* Tamaño de fuente más grande */
                padding: 0.5rem 1rem; /* Aumentar el padding */
                border-radius: 0.5rem; /* Redondear los bordes */
            }
        `;
        document.head.appendChild(style);
    }
    
    function renderProducts(products) {
        // Agregar estilos personalizados al cargar los productos
        addCustomStyles();
    
        productosTable.innerHTML = '';
        products.forEach(product => {
            const row = productosTable.insertRow();
            row.insertCell();
            row.insertCell().innerHTML = `<img src="/static/images/productos-insertados/${product.imagen}" alt="${product.nombre}" style="width: 50px; height: 50px;">`;
            row.insertCell().textContent = product.nombre;
            row.insertCell().textContent = `$${product.precio.toLocaleString()}`;
            row.insertCell().textContent = product.categoriaNombre;
    
            // Celda para tallas y stock
            const tallasStockCell = row.insertCell();
    
            // Verificamos si el producto tiene información de tallas y stock
            if (product.tallas_stock && product.tallas_stock.length > 0) {
                // Dividimos la cadena de tallas y stock
                const tallasStockArray = product.tallas_stock.split(',');
    
                tallasStockArray.forEach(tallaStock => {
                    // Separar talla y stock por ":"
                    const [talla, stock] = tallaStock.split(':');
    
                    // Crear un badge para mostrar la talla y su stock
                    const badge = document.createElement('span');
                    badge.className = 'badge badge-info-custom'; // Aplicar clase personalizada
                    badge.textContent = `${talla.trim()}: ${stock.trim()}`;
                    tallasStockCell.appendChild(badge);
                });
            } else {
                const badge = document.createElement('span');
                badge.className = 'badge badge-secondary-custom'; // Aplicar clase personalizada
                badge.textContent = 'Sin tallas';
                tallasStockCell.appendChild(badge);
            }
    
            row.insertCell().innerHTML = `
                <a href="#editarProducto" class="edit-button" data-toggle="modal" data-id="${product.idProducto}">
                    <i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
                </a>
                <a href="#eliminarProducto" class="delete" data-toggle="modal" data-id="${product.idProducto}">
                    <i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
                </a>
            `;
        });
    
        attachEventListeners();
    }
    
    
    
    
    

    function renderPagination(totalItems) {
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const createPageItem = (page, isActive = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isActive ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = page;
            a.addEventListener('click', function (event) {
                event.preventDefault();
                currentPage = page;
                filterProducts(searchInput.value);
            });
            li.appendChild(a);
            return li;
        };

        const createPrevNextItem = (text, isDisabled, handler) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.textContent = text;
            a.addEventListener('click', function (event) {
                event.preventDefault();
                if (!isDisabled) handler();
            });
            li.appendChild(a);
            return li;
        };

        paginationContainer.appendChild(createPrevNextItem('Anterior', currentPage === 1, () => {
            currentPage--;
            filterProducts(searchInput.value);
        }));

        for (let page = 1; page <= totalPages; page++) {
            paginationContainer.appendChild(createPageItem(page, page === currentPage));
        }

        paginationContainer.appendChild(createPrevNextItem('Siguiente', currentPage === totalPages, () => {
            currentPage++;
            filterProducts(searchInput.value);
        }));
    }

    function fetchProductos() {
        fetch('/api/productos')
            .then(response => response.json())
            .then(data => {
                productos = data;
                filterProducts(searchInput.value); // Renderizar la primera página de productos
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    document.getElementById('editarProductoForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevenir el envío del formulario por defecto
        
        const formData = new FormData(this);
    
        const { tallas, stocks } = gatherTallasAndStock();
    
        // Agregar tallas y stocks al FormData
        formData.append('talla', tallas);
        formData.append('stock', stocks);
    
        fetch(this.action, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error de red');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Producto actualizado exitosamente.');
                location.reload();  // Recargar la página
            } else {
                console.error('Error al actualizar el producto:', data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    });
    
    // Llamada inicial para obtener productos
    fetchProductos();

    // Función de búsqueda en tiempo real
    searchInput.addEventListener('keyup', function () {
        filterProducts(searchInput.value);
    });
});
