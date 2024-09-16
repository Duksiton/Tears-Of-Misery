create database tearsOfMisery;
use tearsOfMisery;


create table roles (
idRol int primary key auto_increment NOT NULL unique,
nombreRol varchar (20) NOT NULL unique 
);

create table usuario (
idUsuario int primary key auto_increment NOT NULL unique,
nombre varchar (50) NOT NULL,
email varchar (60) NOT NULL unique,
contraseña varchar (70) NOT NULL,
direccion varchar (60) NOT NULL,
telefono varchar (10) NOT NULL,
nombreRol varchar (20) NOT NULL DEFAULT 'Usuario',
foreign key (nombreRol) references roles(nombreRol)
);

create table categoria (
idCat int primary key auto_increment NOT NULL unique,
nombre ENUM('Camisas','Discos','Sacos') unique,
descripcion varchar (40) NOT NULL unique
);

create table producto (
idProducto int primary key auto_increment NOT NULL unique,
nombre varchar (50) NOT NULL,
descripcion varchar (50) NOT NULL,
precio float NOT NULL,
imagen varchar (255) NOT NULL,
idCat int NOT NULL,
foreign key (idCat) references categoria (idCat)
);

CREATE TABLE producto_tallas (
    idTalla INT PRIMARY KEY AUTO_INCREMENT NOT NULL UNIQUE,
    idProducto INT NOT NULL,
    talla ENUM('S', 'M', 'L', 'XL') NOT NULL,
    stock INT NOT NULL,
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto) ON DELETE CASCADE
);


CREATE TABLE historial_compras (
    idCompra INT PRIMARY KEY AUTO_INCREMENT NOT NULL UNIQUE,
    idUsuario INT NOT NULL,
    idProducto INT,
    nombreProducto VARCHAR(50) NOT NULL,
    imagenProducto VARCHAR(255) NOT NULL,
    fechaCompra DATE NOT NULL,
    cantidad INT NOT NULL,
    total FLOAT NOT NULL,
    estado ENUM('Pendiente', 'Enviado', 'Cancelado') DEFAULT 'Pendiente',
    FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto) ON DELETE SET NULL
);

insert into roles (nombreRol) values ('Administrador');
insert into roles (nombreRol) values ('Usuario');



insert into categoria (nombre, descripcion) values ('Camisas', 'Negra con rayas');
insert into categoria (nombre, descripcion) values ('Discos', 'Disco pionero');
insert into categoria (nombre, descripcion) values ('Sacos', 'Sin capota');

SELECT * FROM usuario;
SELECT * FROM categoria;
SELECT * FROM producto;
SELECT * FROM historial_compras;
SELECT * FROM producto_tallas;




