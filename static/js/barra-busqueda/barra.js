document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const productosTable = document.getElementById('productosTable').getElementsByTagName('tbody')[0];
    const paginationElement = document.getElementById('pagination');

    let productos = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    function formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    function renderProducts(products) {
        productosTable.innerHTML = ''; // Limpiar tabla

        products.forEach((product, index) => {
            const row = productosTable.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><img src="static/images/${product.imagen}" alt="${product.nombre}" style="width: 50px; height: 50px;"></td>
                <td>${product.nombre}</td>
                <td>${product.descripcion}</td>
                <td>${formatPrice(product.precio)}</td>
                <td>${product.stock}</td>
                <td>${product.categoriaNombre || 'N/A'}</td>
                <td>${product.talla || 'N/A'}</td>
                <td>
                    <a href="#editarProducto" class="edit-button" data-toggle="modal" data-id="${product.idProducto}">
                        <i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
                    </a>
                    <a href="#eliminarProducto" class="delete-button" data-toggle="modal" data-id="${product.idProducto}">
                        <i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
                    </a>
                </td>
            `;
        });

        initializeEventListeners();
    }

    function renderPagination(totalItems, itemsPerPage, currentPage) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        paginationElement.innerHTML = '';

        if (currentPage > 1) {
            paginationElement.innerHTML += `<li class="page-item"><a href="#" class="page-link" data-page="${currentPage - 1}">Anterior</a></li>`;
        } else {
            paginationElement.innerHTML += `<li class="page-item disabled"><a href="#" class="page-link">Anterior</a></li>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            paginationElement.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a href="#" class="page-link" data-page="${i}">${i}</a></li>`;
        }

        if (currentPage < totalPages) {
            paginationElement.innerHTML += `<li class="page-item"><a href="#" class="page-link" data-page="${currentPage + 1}">Siguiente</a></li>`;
        } else {
            paginationElement.innerHTML += `<li class="page-item disabled"><a href="#" class="page-link">Siguiente</a></li>`;
        }

        initializePaginationEventListeners();
    }

    function initializeEventListeners() {
        // Edit button event listeners
        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach(button => {
            button.addEventListener('click', function () {
                const productoId = this.getAttribute('data-id');
                const form = document.getElementById('editarProductoForm');
                form.action = `/update_product/${productoId}`;

                console.log('Fetching product data from:', `/producto/${productoId}`);

                fetch(`/producto/${productoId}`) // Cambiado aquí
                    .then(response => {
                        console.log('Response status:', response.status);
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Datos recibidos del servidor:', data);
                        // Rellenar el formulario
                        document.getElementById('nombreEdit').value = data.nombre || '';
                        document.getElementById('descripcionEdit').value = data.descripcion || '';
                        document.getElementById('precioEdit').value = data.precio || '';
                        document.getElementById('stockEdit').value = data.stock || '';

                        // Manejo de la imagen
                        const fileInput = document.getElementById('imagenEdit');
                        const fileName = document.querySelector('.file-name-edit');
                        const container = document.querySelector('.file-upload-container-edit');
                        const imagenActualInput = document.getElementById('imagenActual');

                        if (data.imagen) {
                            console.log('Asignando nombre de imagen:', data.imagen);
                            fileName.textContent = data.imagen;
                            container.classList.add('file-selected-edit', 'file-has-image');
                            imagenActualInput.value = data.imagen; // Guardar el nombre de la imagen actual
                        } else {
                            console.log('No hay imagen');
                            fileName.textContent = '';
                            container.classList.remove('file-selected-edit', 'file-has-image');
                            imagenActualInput.value = '';
                        }
                    })
                    .catch(error => {
                        console.error('Error al obtener datos del producto:', error);
                    });
            });
        });

        // Delete button event listeners
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const productoId = this.getAttribute('data-id');
                const deleteForm = document.getElementById('deleteForm');
                deleteForm.action = `/delete_product/${productoId}`;
                $('#eliminarProducto').modal('show');
            });
        });
    }

    function initializePaginationEventListeners() {
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (!isNaN(page)) {
                    currentPage = page;
                    renderCurrentPage();
                }
            });
        });
    }

    

    // Manejo de la carga de imagen
    document.getElementById('imagenEdit').addEventListener('change', function () {
        const fileInput = this;
        const fileName = document.querySelector('.file-name-edit');
        const container = document.querySelector('.file-upload-container-edit');
        const imagenActualInput = document.getElementById('imagenActual');

        if (fileInput.files && fileInput.files[0]) {
            fileName.textContent = fileInput.files[0].name;
            container.classList.add('file-selected-edit', 'file-has-image');
            imagenActualInput.value = ''; // Limpiar el valor de la imagen actual
        } else {
            const imagenActual = imagenActualInput.value;
            fileName.textContent = imagenActual || '';
            if (imagenActual) {
                container.classList.add('file-has-image');
            } else {
                container.classList.remove('file-selected-edit', 'file-has-image');
            }
        }
        console.log('Cambio en la imagen. Nuevo nombre:', fileName.textContent);
    });

    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        filterProducts(searchInput.value);
    });

    fetch(`/producto/data/${productoId}`)
    .then(response => {
        console.log('Fetching product data from:', `/producto/data/${productoId}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos del servidor:', data);
        
        // Rellenar el formulario con los datos recibidos
        document.getElementById('nombreEdit').value = data.nombre || '';
        document.getElementById('descripcionEdit').value = data.descripcion || '';
        document.getElementById('precioEdit').value = data.precio || '';
        document.getElementById('stockEdit').value = data.stock || '';
        document.getElementById('tallaEdit').value = data.talla || ''; // Asegúrate de que este campo existe en el formulario

        // Manejo de la imagen
        const fileName = document.querySelector('.file-name-edit');
        const container = document.querySelector('.file-upload-container-edit');
        const imagenActualInput = document.getElementById('imagenActual');

        if (data.imagen) {
            console.log('Asignando nombre de imagen:', data.imagen);
            fileName.textContent = data.imagen; // Mostrar nombre de la imagen
            container.classList.add('file-selected-edit', 'file-has-image');
            imagenActualInput.value = data.imagen; // Guardar el nombre de la imagen actual
        } else {
            console.log('No hay imagen, reiniciando campos de imagen.');
            fileName.textContent = '';
            container.classList.remove('file-selected-edit', 'file-has-image');
            imagenActualInput.value = ''; // Limpiar el valor de la imagen actual
        }
        
        console.log('Estado final de fileName:', fileName.textContent);
        console.log('Estado final de imagenActualInput:', imagenActualInput.value);
    })
    .catch(error => console.error('Error al obtener datos del producto:', error));


});
