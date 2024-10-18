document.addEventListener('DOMContentLoaded', function() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    console.log("Carrito cargado desde localStorage:", carrito);
    const totalCarritoSpan = document.getElementById('total-valor');
    const carritoContainer = document.getElementById('carrito');
    const imgCarrito = document.getElementById('img-carrito');
    const verMasContainer = document.getElementById('ver-mas-container');
    const verMasLink = document.getElementById('toggle-productos');
    let mostrarMas = false;

    // Ocultar el carrito inicialmente
    carritoContainer.style.display = 'none';

    // Evento para mostrar/ocultar el carrito al hacer clic en el icono
    imgCarrito.addEventListener('click', function() {
        carritoContainer.style.display = carritoContainer.style.display === 'none' ? 'block' : 'none';
    });
  
    document.addEventListener('click', function(event) {
        const imgCarrito = document.getElementById('img-carrito');
    
        // Solo cerrar el carrito si está visible
        if (carritoContainer.style.display === 'block') {
            // Cerrar carrito solo si se hace clic fuera del contenedor y del ícono
            if (!carritoContainer.contains(event.target) && !imgCarrito.contains(event.target)) {
                carritoContainer.style.display = 'none';
            }
        }
    });
    
    // Evitar que el clic dentro del carrito cierre el contenedor
    carritoContainer.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Manejar la cantidad de productos
    function initializeQuantityControl() {
        const quantityInput = document.querySelector('.input-quantity');
        const incrementButton = document.querySelector('.fa-chevron-up');
        const decrementButton = document.querySelector('.fa-chevron-down');
    
        if (!quantityInput || !incrementButton || !decrementButton) {
            console.error("No se encontraron todos los elementos necesarios para el control de cantidad");
            return;
        }
    
        console.log("Elementos de control de cantidad encontrados");
    
        function updateQuantity(newValue) {
            newValue = Math.max(1, parseInt(newValue, 10) || 1);
            quantityInput.value = newValue;
            console.log("Cantidad actualizada a:", newValue);
        }
    
        incrementButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            updateQuantity(parseInt(quantityInput.value, 10) + 1);
        });
    
        decrementButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto
            updateQuantity(parseInt(quantityInput.value, 10) - 1);
        });
    
        quantityInput.addEventListener('change', function() {
            updateQuantity(this.value);
        });
    
        // Inicializar con un valor válido
        updateQuantity(quantityInput.value);
    }
    
    // Llamar a la función cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeQuantityControl);
    } else {
        initializeQuantityControl();
    }

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
        const precioRedondeado = Math.round(precio * 100) / 100;
        const [parteEntera, parteDecimal] = precioRedondeado.toFixed(2).split('.');
        const parteEnteraFormateada = new Intl.NumberFormat('es-CO').format(parseInt(parteEntera));
        return parteDecimal === '00' ? `$${parteEnteraFormateada}` : `$${parteEnteraFormateada},${parteDecimal}`;
    }
    
    

    function mostrarMensaje(mensaje, tipo = 'success') {
        modalContent.innerHTML = `
            <h2 style="color: ${tipo === 'success' ? '#ffbb00' : tipo === 'info' ? '#ffbb00' : '#dc3545'}; font-size: 36px; margin-bottom: 20px;">
                ${tipo === 'success' ? '¡Éxito!' : tipo === 'info' ? 'Información' : 'Atención'}
            </h2>
            <p style="font-size: 24px; margin-bottom: 30px;">${mensaje}</p>
            <button id="cerrarModal" 
                    style="background-color: #ffbb00; color: black; border: none; 
                    padding: 15px 30px; margin-top: 20px; border-radius: 8px; cursor: pointer;
                    font-size: 20px; transition: background-color 0.3s;">
                Cerrar
            </button>
        `;
        modal.style.display = 'block';
    
        document.getElementById('cerrarModal').addEventListener('click', function() {
            modal.style.display = 'none';
        });
    
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function actualizarCarrito() {
        const carritoBody = document.getElementById('productos');
        if (!carritoBody) return;

        carritoBody.innerHTML = '';

        const itemsMostrar = mostrarMas ? carrito : carrito.slice(0, 3);

        itemsMostrar.forEach((item, index) => {
            const row = carritoBody.insertRow();
            row.innerHTML = `
                <td><img src="${item.img}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
                <td style="font-weight: bold;">${item.name} ${item.size ? `(${item.size})` : ''} ${item.quantity > 1 ? `x${item.quantity}` : ''}</td>
                <td style="color: #000;">${formatearPrecio(item.price * item.quantity)}</td>
                <td>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button class="btn-decrease" data-index="${index}" style="background-color: #b4b6b9; color: black; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">-</button>
                        <span style="margin: 0 5px;">${item.quantity}</span>
                        <button class="btn-increase" data-index="${index}" style="background-color: #b4b6b9; color: black; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </td>
                <td>
                    <button class="btn-remove" data-index="${index}" style="background-color: transparent; color: #c00000; border: none; padding: 6px; border-radius: 6px; cursor: pointer; margin-right: 6px; font-size: 12px;">
                        <i class="fas fa-trash-alt" style="font-size: 14px; color: #c00000;"></i>
                    </button>
                    <br>
                    <br>
                </td>
            `;
        });

        const total = carrito.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (totalCarritoSpan) {
            totalCarritoSpan.textContent = formatearPrecio(total);
        }

        if (verMasContainer) {
            verMasContainer.style.display = carrito.length > 3 ? 'block' : 'none';
        }
        if (verMasLink) {
            verMasLink.textContent = mostrarMas ? 'Ocultar productos' : 'Ver más productos agregados';
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

    function agregarAlCarrito(product) {
        // Verificar el stock antes de agregar el producto al carrito
        fetch('/api/verificar_stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                idProducto: product.id,
                talla: product.size,
                cantidad: product.quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const index = carrito.findIndex(item => item.name === product.name && item.size === product.size);
                if (index !== -1) {
                    // Asegurarse de que no exceda el stock disponible
                    const nuevaCantidad = carrito[index].quantity + product.quantity;
                    if (nuevaCantidad > data.stock_disponible) {
                        mostrarMensaje(`No puedes agregar más de ${data.stock_disponible} unidades de "${product.name}" (${product.size}) al carrito.`, 'error');
                    } else {
                        carrito[index].quantity = nuevaCantidad;
                        mostrarMensaje(`Cantidad de "${product.name}" (${product.size}) aumentada. Ahora tienes ${carrito[index].quantity}.`, 'success');
                        actualizarCarrito();
                    }
                } else {
                    carrito.push(product);
                    mostrarMensaje(`Nuevo producto "${product.name}" (${product.size}) agregado al carrito.`, 'success');
                    actualizarCarrito();
                }
            } else {
                mostrarMensaje(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error al verificar el stock:', error);
            mostrarMensaje('Ocurrió un error al verificar el stock. Intenta nuevamente.', 'error');
        });
    }

    const usuarioLogueado = false; // Cambia a `true` si el usuario ha iniciado sesión.

    if (document.getElementById('productos')) {
        document.getElementById('productos').addEventListener('click', function(e) {
            const index = parseInt(e.target.dataset.index);

            if (e.target.classList.contains('btn-increase')) {
                carrito[index].quantity += 1;
                actualizarCarrito();
            }

            if (e.target.classList.contains('btn-decrease')) {
                if (carrito[index].quantity > 1) {
                    carrito[index].quantity -= 1;
                } else {
                    carrito.splice(index, 1);
                }
                actualizarCarrito();
            }

            if (e.target.classList.contains('btn-remove')) {
                carrito.splice(index, 1);
                actualizarCarrito();
            }
        });
    }

    if (document.getElementById('vaciar-carrito')) {
        document.getElementById('vaciar-carrito').addEventListener('click', function() {
            if (carrito.length === 0) {
                mostrarMensaje('El carrito ya está vacío.', 'info');
            } else {
                carrito.length = 0;
                actualizarCarrito();
                mostrarMensaje('El carrito ha sido vaciado.', 'info');
            }
        });
    }

    if (document.getElementById('comprar-todo')) {
        document.getElementById('comprar-todo').addEventListener('click', function() {
            if (carrito.length === 0) {
                mostrarMensaje('El carrito está vacío.', 'info');
                return;
            }

            if (!usuarioLogueado) {
                mostrarMensaje('Primero inicia sesión para realizar la compra.', 'info');
                return;
            }

            const total = carrito.reduce((sum, item) => sum + item.price * item.quantity, 0);
            mostrarMensaje(`Has comprado todos los productos por ${formatearPrecio(total)}. ¡Gracias por tu compra!`);
            carrito.length = 0;
            actualizarCarrito();
        });
    }

    if (verMasLink) {
        verMasLink.addEventListener('click', function() {
            mostrarMas = !mostrarMas;
            actualizarCarrito();
        });
    }

    // Agregar al carrito desde la página de detalles del producto
    const addToCartButton = document.getElementById('add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            // Obtener tallas seleccionadas
            const selectedTallas = Array.from(document.querySelectorAll('input[name="tallas"]:checked'))
                .map(input => input.value);
            console.log('Tallas seleccionadas:', selectedTallas);

            // Verificar si se requiere talla
            const requiereTalla = addToCartButton.getAttribute('data-size') === 'required';
            console.log('Requiere talla:', requiereTalla);

            // Obtener cantidad seleccionada
            const quantityInput = document.querySelector('.input-quantity');
            const quantity = parseInt(quantityInput.value, 10) || 1;
            console.log('Cantidad seleccionada:', quantity);

            // Verificar si se requiere una talla y si se ha seleccionado alguna
            if (requiereTalla && selectedTallas.length === 0) {
                mostrarMensaje('Por favor selecciona una talla antes de agregar al carrito.', 'info');
                return;
            }

            // Si no se requiere talla, asignar una talla por defecto
            const size = requiereTalla ? (selectedTallas[0] || "") : "";
            console.log('Tamaño seleccionado:', size);

            const product = {
                id: addToCartButton.getAttribute('data-product-id'),
                name: addToCartButton.getAttribute('data-name'),
                price: parseFloat(addToCartButton.getAttribute('data-price')),
                img: addToCartButton.getAttribute('data-img'),
                size: size,
                quantity: quantity
            };

            agregarAlCarrito(product);
        });
    }

    // Inicializar la vista del carrito
    actualizarCarrito();
});