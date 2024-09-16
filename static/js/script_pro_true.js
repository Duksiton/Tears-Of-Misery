document.addEventListener('DOMContentLoaded', function () {
    // Inicializar carrito desde localStorage
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalCarritoSpan = document.getElementById('total-valor');
    const carritoContainer = document.getElementById('carrito');
    const imgCarrito = document.getElementById('img-carrito');
    const verMasContainer = document.getElementById('ver-mas-container');
    const verMasLink = document.getElementById('toggle-productos');
    let mostrarMas = false;
    let usuarioLogueado = false;
    let idUsuario = null;

    // Ocultar el carrito inicialmente
    carritoContainer.style.display = 'none';

    // Evento para mostrar/ocultar el carrito al hacer clic en el icono
    imgCarrito.addEventListener('click', function () {
        carritoContainer.style.display = carritoContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function (event) {
        if (carritoContainer.style.display === 'block') {
            if (!carritoContainer.contains(event.target) && !imgCarrito.contains(event.target)) {
                carritoContainer.style.display = 'none';
            }
        }
    });

    carritoContainer.addEventListener('click', function (event) {
        event.stopPropagation();
    });

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
        let [parteEntera, parteDecimal] = precioRedondeado.toFixed(3).split('.');
        parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `$${parteEntera}.${parteDecimal}`;
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

        document.getElementById('cerrarModal').addEventListener('click', function () {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', function (event) {
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
                <td style="font-weight: bold;">${item.name} (${item.size}) ${item.quantity > 1 ? `x${item.quantity}` : ''}</td>
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
                    <br><br>
                </td>
            `;
        });

        const total = carrito.reduce((sum, item) => sum + item.price * item.quantity, 0);
        totalCarritoSpan.textContent = formatearPrecio(total);

        verMasContainer.style.display = carrito.length > 3 ? 'block' : 'none';
        verMasLink.textContent = mostrarMas ? 'Ocultar productos' : 'Ver más productos agregados';

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


    // Obtener el estado de inicio de sesión del servidor
    fetch('/api/estado_sesion')
        .then(response => response.json())
        .then(data => {
            usuarioLogueado = data.usuarioLogueado;
            idUsuario = data.idUsuario;
            actualizarCarrito();  // Actualizar el carrito en caso de que se necesite después de verificar el estado de inicio de sesión
        })
        .catch(error => {
            console.error('Error al obtener el estado de inicio de sesión:', error);
        });

    document.getElementById('productos').addEventListener('click', function (e) {
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

    document.getElementById('vaciar-carrito').addEventListener('click', function () {
        if (carrito.length === 0) {
            mostrarMensaje('El carrito ya está vacío.', 'info');
        } else {
            carrito.length = 0;
            actualizarCarrito();
            mostrarMensaje('El carrito ha sido vaciado.', 'info');
        }
    });

    document.getElementById('comprar-todo').addEventListener('click', function () {
        if (carrito.length === 0) {
            mostrarMensaje('El carrito está vacío.', 'info');
            return;
        }

        if (!usuarioLogueado) {
            mostrarMensaje('Primero inicia sesión para realizar la compra.', 'info');
            return;
        }

        const total = carrito.reduce((sum, item) => sum + item.price * item.quantity, 0);
        mostrarMensaje(`La suma de tus productos es de: ${formatearPrecio(total)}, serás redirigido para confirmar tus datos, ¡gracias por la compra!`);

        // Preparar los datos del carrito para enviarlos a la API
        const productosCarrito = carrito.map(item => ({
            idProducto: item.id,
            nombreProducto: item.name,
            talla: item.size,
            cantidad: item.quantity,
            total: item.price * item.quantity
        }));

        // Actualizar stock para cada producto en el carrito
        productosCarrito.forEach(product => {
            actualizarStock(product.idProducto, product.talla, product.cantidad);
        });

        carrito.length = 0;
        actualizarCarrito();

        // Verificar datos antes de enviar
        console.log("Datos del carrito antes de enviar:", carrito);

        // Realizar la petición a la API para guardar la compra
        setTimeout(function () {
            fetch('/api/guardar_compra', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productos: productosCarrito,
                    total: total,
                    fechaCompra: new Date().toISOString().split('T')[0]  // Formato YYYY-MM-DD
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        mostrarMensaje(data.message);
                    } else {
                        mostrarMensaje(data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error al guardar la compra:', error);
                });

            // Redirigir a la página de verificación del usuario
            window.location.href = '/verificar_usuario';
        }, 2500);
    });




    verMasLink.addEventListener('click', function () {
        mostrarMas = !mostrarMas;
        actualizarCarrito();
    });

    // Agrega el evento para el botón "Agregar al carrito" en la página de detalles del producto
    const addToCartButton = document.getElementById('add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            // Verifica el valor del atributo data-size
            const requiereTalla = addToCartButton.getAttribute('data-size');
            console.log('Valor de data-size:', requiereTalla); // Debería mostrar "required" o "optional"

            // Verifica si se requiere una talla
            const requiresSize = requiereTalla === 'required';
            console.log('Requiere talla:', requiresSize);

            // Verifica las checkboxes y muestra los estados de selección
            const checkboxes = Array.from(document.querySelectorAll('#tallas-section .talla-checkbox'));
            checkboxes.forEach(checkbox => {
                console.log(`Checkbox con valor ${checkbox.value} está ${checkbox.checked ? 'seleccionado' : 'no seleccionado'}`);
            });

            // Obtén todas las checkboxes de talla seleccionadas
            const selectedSizes = Array.from(document.querySelectorAll('#tallas-section .talla-checkbox:checked'))
                .map(checkbox => checkbox.value);

            console.log('Tallas seleccionadas:', selectedSizes);

            // Obtén la cantidad del producto
            const quantity = parseInt(document.getElementById('quantityInput').value, 10);
            console.log('Cantidad:', quantity);

            // Verifica si se ha seleccionado una talla cuando es requerida
            if (requiresSize && selectedSizes.length === 0) {
                console.log('Por favor selecciona una talla antes de agregar al carrito.');
                mostrarMensaje('Por favor selecciona una talla antes de agregar al carrito.', 'info');
                return;
            }

            // Si no hay tallas seleccionadas pero se requiere, usa "Album" como talla predeterminada
            const size = selectedSizes.length > 0 ? selectedSizes[0] : "Album";

            const product = {
                id: addToCartButton.getAttribute('data-product-id'),
                name: addToCartButton.getAttribute('data-name'),
                price: parseFloat(addToCartButton.getAttribute('data-price')),
                img: addToCartButton.getAttribute('data-img'),
                size: size,
                quantity: quantity || 1
            };

            console.log('Producto:', product);

            agregarAlCarrito(product);
        });
    }

    actualizarCarrito();



});

// Preparar los datos del carrito para enviarlos a la API
function actualizarStock(idProducto, talla, cantidad) {
    fetch('/api/actualizar_stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            idProducto: idProducto,
            talla: talla,
            cantidad: cantidad
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Stock actualizado con éxito');
            } else {
                console.error('Error al actualizar el stock:', data.message);
            }
        })
        .catch(error => {
            console.error('Error al conectar con la API:', error);
        });
}




