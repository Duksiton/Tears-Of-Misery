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
talla ENUM('S','M','L','XL') ,
precio float NOT NULL,
stock int NOT NULL, 
imagen varchar (255) NOT NULL,
idCat int NOT NULL,
foreign key (idCat) references categoria (idCat)
);

create table pedido (
idPedido int primary key auto_increment NOT NULL unique,
fechaPedido date NOT NULL,
totalPedido float NOT NULL,
estado varchar (40) NOT NULL,
idUsuario int NOT NULL, 
foreign key (idUsuario) references usuario (idUsuario)
);

CREATE TABLE pedido_producto (
    idPedidoProducto INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    idPedido INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (idPedido) REFERENCES pedido(idPedido),
    FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
);


create table detallePedido (
idDetalle int primary key auto_increment NOT NULL unique,
cantidad int NOT NULL,
precio float NOT NULL,
idProducto int NOT NULL,
foreign key (idProducto) references producto (idProducto),
idPedido int NOT NULL,
foreign key (idPedido) references pedido (idPedido)
);

insert into roles (nombreRol) values ('Administrador');
insert into roles (nombreRol) values ('Usuario');



insert into categoria (nombre, descripcion) values ('Camisas', 'Negra con rayas');
insert into categoria (nombre, descripcion) values ('Discos', 'Disco pionero');
insert into categoria (nombre, descripcion) values ('Sacos', 'Sin capota');

select * from usuario;
select * from categoria;
select * from pedido;	
select * from pedido_producto;
select * from producto;