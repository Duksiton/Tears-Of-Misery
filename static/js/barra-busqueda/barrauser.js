document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const usuariosTable = document.getElementById("usuariosTable");
  const tableBody = usuariosTable.getElementsByTagName("tbody")[0];
  const paginationContainer = document.getElementById("pagination");

  const itemsPerPage = 5;
  let currentPage = 1;
  let totalItems = 0;
  let usuarios = [];

  // Función para filtrar usuarios por cualquier campo de la tabla usuario
  function filterUsers(query) {
      const lowerCaseQuery = query.toLowerCase();
      const filteredUsers = usuarios.filter((user) =>
          user.nombre.toLowerCase().includes(lowerCaseQuery) ||
          user.email.toLowerCase().includes(lowerCaseQuery) ||
          user.direccion.toLowerCase().includes(lowerCaseQuery) ||
          user.telefono.toLowerCase().includes(lowerCaseQuery) ||
          user.nombreRol.toLowerCase().includes(lowerCaseQuery)
      );
      renderUsers(filteredUsers);
      renderPagination(filteredUsers.length);
  }

  // Renderizar los usuarios en la tabla
  function renderUsers(users) {
      tableBody.innerHTML = "";
      if (users.length === 0) {
          const row = tableBody.insertRow();
          const cell = row.insertCell(0);
          cell.colSpan = 6;
          cell.style.textTransform = "none";
          cell.textContent = "Para buscar usuarios use la barra de busqueda.";

      } else {
          users.forEach((user) => {
              const row = tableBody.insertRow();
              row.insertCell();
              row.insertCell().textContent = user.nombre;
              row.insertCell().textContent = user.email;
              row.insertCell().textContent = user.direccion;
              row.insertCell().textContent = user.telefono;
              row.insertCell().textContent = user.nombreRol;
              row.insertCell().innerHTML = `
                <a href="#editarUsuario" class="edit-button" data-toggle="modal" data-id="${user.idUsuario}">
                    <i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
                </a>
                <a href="#eliminarUsuario" class="delete" data-toggle="modal" data-id="${user.idUsuario}">
                    <i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
                </a>
              `;
          });
      }

      attachEditListeners();
      attachDeleteListeners();
  }

  // Renderizar la paginación
  function renderPagination(totalItems) {
      paginationContainer.innerHTML = "";

      if (totalItems === 0) {
          return; // No mostrar paginación si no hay usuarios
      }

      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const createPageItem = (page, isActive = false) => {
          const li = document.createElement("li");
          li.className = `page-item ${isActive ? "active" : ""}`;
          const a = document.createElement("a");
          a.className = "page-link";
          a.href = "#";
          a.textContent = page;
          a.addEventListener("click", function (event) {
              event.preventDefault();
              currentPage = page;
              filterUsers(searchInput.value);
          });
          li.appendChild(a);
          return li;
      };

      const createPrevNextItem = (text, isDisabled, handler) => {
          const li = document.createElement("li");
          li.className = `page-item ${isDisabled ? "disabled" : ""}`;
          const a = document.createElement("a");
          a.className = "page-link";
          a.href = "#";
          a.textContent = text;
          a.addEventListener("click", function (event) {
              event.preventDefault();
              if (!isDisabled) handler();
          });
          li.appendChild(a);
          return li;
      };

      paginationContainer.appendChild(
          createPrevNextItem("Anterior", currentPage === 1, () => {
              currentPage--;
              filterUsers(searchInput.value);
          })
      );

      for (let page = 1; page <= totalPages; page++) {
          paginationContainer.appendChild(
              createPageItem(page, page === currentPage)
          );
      }

      paginationContainer.appendChild(
          createPrevNextItem("Siguiente", currentPage === totalPages, () => {
              currentPage++;
              filterUsers(searchInput.value);
          })
      );
  }

  // Obtener usuarios de la API
  function fetchUsuarios(query = "") {
      fetch(`/api/usuarios?page=${currentPage}&items_per_page=${itemsPerPage}&query=${encodeURIComponent(query)}`)
          .then((response) => response.json())
          .then((data) => {
              usuarios = data.usuarios;
              totalItems = data.total;
              renderUsers([]);
              renderPagination(usuarios.length); // Cambiado para que solo muestre los usuarios después del filtrado
          })
          .catch((error) => console.error("Error fetching users:", error));
  }

  // Asignar listeners para editar usuarios
  function attachEditListeners() {
      const editButtons = document.querySelectorAll(".edit-button");

      editButtons.forEach(button => {
          button.addEventListener("click", function () {
              const usuarioId = this.getAttribute("data-id");
              const form = document.getElementById("editarUsuarioForm");
              form.action = `/update_user/${usuarioId}`;

              fetch(`/usuarios/${usuarioId}`)
                  .then(response => {
                      if (!response.ok) {
                          throw new Error("Network response was not ok");
                      }
                      return response.json();
                  })
                  .then(data => {
                      document.getElementById("nombreEditar").value = data.nombre || "";
                      document.getElementById("emailEditar").value = data.email || "";
                      document.getElementById("direccionEditar").value = data.direccion || "";
                      document.getElementById("telefonoEditar").value = data.telefono || "";

                      const selectRol = document.getElementById("nombreRolEditar");
                      if (selectRol) {
                          for (let i = 0; i < selectRol.options.length; i++) {
                              if (selectRol.options[i].value === data.nombreRol) {
                                  selectRol.selectedIndex = i;
                                  break;
                              }
                          }
                      }
                  })
                  .catch(error => {
                      console.error("Error al obtener datos del usuario:", error);
                  });
          });
      });
  }

  // Asignar listeners para eliminar usuarios
  function attachDeleteListeners() {
      const deleteButtons = document.querySelectorAll(".delete");

      deleteButtons.forEach(button => {
          button.addEventListener("click", function () {
              const usuarioId = this.getAttribute("data-id");
              const form = document.getElementById("deleteUserForm");
              form.action = `/delete_user/${usuarioId}`;
              document.getElementById("userIdToDelete").value = usuarioId;

              const deleteModal = document.getElementById("eliminarUsuario");
              if (deleteModal) {
                  $(deleteModal).modal("show");
              } else {
                  console.error("Modal de eliminación no encontrado");
              }
          });
      });
  }

  // Llamada inicial para obtener usuarios (no mostrar hasta buscar)
  fetchUsuarios();

  // Función de búsqueda
  searchInput.addEventListener("keyup", function () {
      currentPage = 1;
      const query = searchInput.value.trim();

      if (query === "") {
          // Si el campo está vacío, limpiar la tabla y la paginación
          tableBody.innerHTML = "";
          paginationContainer.innerHTML = "";
      } else {
          // Si hay algo en la búsqueda, filtrar usuarios
          filterUsers(query);
      }
  });
});
