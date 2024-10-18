document.addEventListener('DOMContentLoaded', function() {
    const carrito = [];
    const totalCarritoSpan = document.getElementById('total-valor');
    const carritoContainer = document.getElementById('carrito');
    const imgCarrito = document.getElementById('img-carrito');
    const verMasContainer = document.getElementById('ver-mas-container');
    const verMasLink = document.getElementById('toggle-productos');
    let mostrarMas = false;

    // Añadir botón de cerrar
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.float = 'right';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    carritoContainer.insertBefore(closeButton, carritoContainer.firstChild);

    // Crear el modal para mensajes
    const modal = document.createElement('div');
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1000';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
    document.body.appendChild(modal);

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.margin = '10% auto';
    modalContent.style.padding = '40px';
    modalContent.style.border = '1px solid #888';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '700px';
    modalContent.style.borderRadius = '15px';
    modalContent.style.textAlign = 'center';
    modalContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    modal.appendChild(modalContent);

    function formatearPrecio(precio) {
        const precioConDecimales = (precio.toFixed(3)).replace('.', ',');
        const [parteEntera, parteDecimal] = precioConDecimales.split(',');
        const parteEnteraFormateada = new Intl.NumberFormat('es-CO').format(parseInt(parteEntera));
        return `$${parteEnteraFormateada}.${parteDecimal}`;
    }

    function mostrarMensaje(mensaje, tipo = 'success') {
        modalContent.innerHTML = `
            <h2 style="color: ${tipo === 'success' ? '#28a745' : '#dc3545'}; font-size: 36px; margin-bottom: 20px;">
                ${tipo === 'success' ? '¡Compra Exitosa!' : 'Atención'}
            </h2>
            <p style="font-size: 24px; margin-bottom: 30px;">${mensaje}</p>
            <button id="cerrarModal" 
                    style="background-color: #007bff; color: white; border: none; 
                    padding: 15px 30px; margin-top: 20px; border-radius: 8px; cursor: pointer;
                    font-size: 20px; transition: background-color 0.3s;">
                Cerrar
            </button>
        `;
        modal.style.display = 'block';

        // Añadir evento de clic al botón de cerrar
        document.getElementById('cerrarModal').addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function actualizarCarrito() {
        const carritoBody = document.getElementById('productos');
        carritoBody.innerHTML = '';

        const itemsMostrar = mostrarMas ? carrito : carrito.slice(0, 3);

        itemsMostrar.forEach((item, index) => {
            const row = carritoBody.insertRow();
            row.innerHTML = `
                <td><img src="${item.img}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: bold;">${item.name}</td>
                <td style="color: #007bff;">${formatearPrecio(item.price)}</td>
                <td><button class="btn-remove" data-index="${index}" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Eliminar</button></td>
                <td><button class="btn-comprar" data-index="${index}" style="background-color: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Comprar</button></td>
            `;
        });

        const total = carrito.reduce((sum, item) => sum + item.price, 0);
        totalCarritoSpan.textContent = formatearPrecio(total);

        carritoContainer.style.display = 'block';

        verMasContainer.style.display = carrito.length > 3 ? 'block' : 'none';
        verMasLink.textContent = mostrarMas ? 'Ocultar productos' : 'Ver más productos agregados';
    }

    function agregarAlCarrito(product) {
        carrito.push(product);
        actualizarCarrito();
    }

    document.querySelectorAll('.btn-2').forEach(button => {
        button.addEventListener('click', function() {
            const product = {
                img: this.dataset.img,
                name: this.dataset.name,
                price: parseFloat(this.dataset.price)
            };
            agregarAlCarrito(product);
        });
    });

    document.getElementById('productos').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const index = parseInt(e.target.dataset.index);
            carrito.splice(index, 1);
            actualizarCarrito();
        }
        
        if (e.target.classList.contains('btn-comprar')) {
            const index = parseInt(e.target.dataset.index);
            const item = carrito[index];
            mostrarMensaje(`Has comprado ${item.name} por ${formatearPrecio(item.price)}`);
            carrito.splice(index, 1);
            actualizarCarrito();
        }
    });

    document.getElementById('vaciar-carrito').addEventListener('click', function() {
        if (carrito.length === 0) {
            mostrarMensaje('El carrito ya está vacío.', 'info');
        } else {
            carrito.length = 0;
            actualizarCarrito();
            mostrarMensaje('El carrito ha sido vaciado.', 'info');
        }
    });

    document.getElementById('comprar-todo').addEventListener('click', function() {
        if (carrito.length === 0) {
            mostrarMensaje('El carrito está vacío.', 'info');
            return;
        }

        const total = carrito.reduce((sum, item) => sum + item.price, 0);
        mostrarMensaje(`¡Compra exitosa! Has adquirido todos los productos por un total de ${formatearPrecio(total)}`);
        carrito.length = 0;
        actualizarCarrito();
    });

    closeButton.addEventListener('click', function() {
        carritoContainer.style.display = 'none';
    });

    imgCarrito.addEventListener('click', function() {
        carritoContainer.style.display = carritoContainer.style.display === 'none' ? 'block' : 'none';
    });

    function ajustarPosicionCarrito() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        carritoContainer.style.top = `${10 + scrollTop}px`;
    }

    window.addEventListener('scroll', ajustarPosicionCarrito);

    verMasLink.addEventListener('click', function(e) {
        e.preventDefault();
        mostrarMas = !mostrarMas;
        actualizarCarrito();
    });
});