-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-02-2026 a las 20:02:28
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd_votaciones`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados`
--

CREATE TABLE `estados` (
  `id_estado` int(11) NOT NULL,
  `nombre_estado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estados`
--

INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES
(1, 'Activo'),
(2, 'Inactivo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lideres`
--

CREATE TABLE `lideres` (
  `id_lider` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `identificacion` varchar(30) NOT NULL,
  `id_tipo_identificacion` int(11) NOT NULL,
  `sexo` enum('M','F','Otro') NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `id_usuario_creador` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_edicion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'SuperAdministrador'),
(2, 'Administrador'),
(3, 'Lider'),
(4, 'Votante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_identificacion`
--

CREATE TABLE `tipos_identificacion` (
  `id_tipo_identificacion` int(11) NOT NULL,
  `nombre_tipo` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipos_identificacion`
--

INSERT INTO `tipos_identificacion` (`id_tipo_identificacion`, `nombre_tipo`) VALUES
(1, 'Cédula de ciudadanía'),
(2, 'Cédula de extranjería'),
(3, 'Pasaporte'),
(4, 'Tarjeta de identidad');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `identificacion` varchar(30) NOT NULL,
  `id_tipo_identificacion` int(11) NOT NULL,
  `sexo` enum('M','F','Otro') NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `clave` varchar(255) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_edicion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombres`, `apellidos`, `identificacion`, `id_tipo_identificacion`, `sexo`, `usuario`, `clave`, `id_rol`, `id_estado`, `fecha_creacion`, `fecha_edicion`) VALUES
(1, 'Super', 'Administrador', '1000000000', 1, 'M', 'admin', '$2y$10$6luXYcgm3HRPLcFoG0sHo.Pjg21bKc8uwR1TE47qUU7kjSMx2X7bm', 1, 1, '2026-01-16 12:55:36', '2026-01-21 00:05:11'),
(9, 'RAMON', 'GONZALEZ', '1104011446', 1, 'M', 'Ramon446', '$2y$10$6luXYcgm3HRPLcFoG0sHo.Pjg21bKc8uwR1TE47qUU7kjSMx2X7bm', 2, 1, '2026-02-14 00:10:52', '2026-02-14 01:01:38'),
(10, 'MARIA ANGELICA', 'NAVAS FLOREZ', '1104015499', 1, 'F', 'Mangelica99', '$2y$10$6luXYcgm3HRPLcFoG0sHo.Pjg21bKc8uwR1TE47qUU7kjSMx2X7bm', 2, 1, '2026-02-14 00:29:48', '2026-02-14 01:20:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `votantes`
--

CREATE TABLE `votantes` (
  `id_votante` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `identificacion` varchar(30) NOT NULL,
  `id_tipo_identificacion` int(11) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `sexo` enum('M','F','Otro') NOT NULL,
  `id_lider` int(11) DEFAULT NULL,
  `mesa` int(20) DEFAULT NULL,
  `lugar_mesa` varchar(50) DEFAULT NULL,
  `id_administrador_directo` int(11) DEFAULT NULL,
  `id_usuario_creador` int(11) NOT NULL,
  `id_estado` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_edicion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `chequeado` int(2) NOT NULL DEFAULT 1 COMMENT '1 sin votar 2 voto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `votantes_duplicados`
--

CREATE TABLE `votantes_duplicados` (
  `id_duplicado` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `mesa` int(11) DEFAULT NULL,
  `lugar_mesa` varchar(100) DEFAULT NULL,
  `tipo_existente` enum('votante','lÝder','usuario') NOT NULL,
  `nombre_existente` varchar(255) NOT NULL,
  `detalles_existente` text DEFAULT NULL,
  `metodo_intento` enum('formulario','excel') NOT NULL,
  `identificacion_lider_intento` varchar(20) DEFAULT NULL,
  `id_usuario_intento` int(11) NOT NULL,
  `nombre_usuario_intento` varchar(255) DEFAULT NULL,
  `fecha_intento` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estados`
--
ALTER TABLE `estados`
  ADD PRIMARY KEY (`id_estado`);

--
-- Indices de la tabla `lideres`
--
ALTER TABLE `lideres`
  ADD PRIMARY KEY (`id_lider`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD KEY `fk_lider_tipo_identificacion` (`id_tipo_identificacion`),
  ADD KEY `idx_usuario_creador` (`id_usuario_creador`),
  ADD KEY `idx_estado` (`id_estado`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `tipos_identificacion`
--
ALTER TABLE `tipos_identificacion`
  ADD PRIMARY KEY (`id_tipo_identificacion`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD KEY `fk_usuario_tipo_identificacion` (`id_tipo_identificacion`),
  ADD KEY `fk_usuario_rol` (`id_rol`),
  ADD KEY `fk_usuario_estado` (`id_estado`);

--
-- Indices de la tabla `votantes`
--
ALTER TABLE `votantes`
  ADD PRIMARY KEY (`id_votante`),
  ADD UNIQUE KEY `identificacion` (`identificacion`),
  ADD KEY `fk_votante_tipo_identificacion` (`id_tipo_identificacion`),
  ADD KEY `fk_votante_lider` (`id_lider`),
  ADD KEY `fk_votante_estado` (`id_estado`),
  ADD KEY `fk_votante_admin_directo` (`id_administrador_directo`),
  ADD KEY `fk_votante_creador` (`id_usuario_creador`);

--
-- Indices de la tabla `votantes_duplicados`
--
ALTER TABLE `votantes_duplicados`
  ADD PRIMARY KEY (`id_duplicado`),
  ADD KEY `idx_identificacion` (`identificacion`),
  ADD KEY `idx_fecha` (`fecha_intento`),
  ADD KEY `idx_tipo` (`tipo_existente`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `lideres`
--
ALTER TABLE `lideres`
  MODIFY `id_lider` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `tipos_identificacion`
--
ALTER TABLE `tipos_identificacion`
  MODIFY `id_tipo_identificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `votantes`
--
ALTER TABLE `votantes`
  MODIFY `id_votante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `votantes_duplicados`
--
ALTER TABLE `votantes_duplicados`
  MODIFY `id_duplicado` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `lideres`
--
ALTER TABLE `lideres`
  ADD CONSTRAINT `fk_lider_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  ADD CONSTRAINT `fk_lider_tipo_identificacion` FOREIGN KEY (`id_tipo_identificacion`) REFERENCES `tipos_identificacion` (`id_tipo_identificacion`),
  ADD CONSTRAINT `fk_lider_usuario_creador` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuario_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  ADD CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`),
  ADD CONSTRAINT `fk_usuario_tipo_identificacion` FOREIGN KEY (`id_tipo_identificacion`) REFERENCES `tipos_identificacion` (`id_tipo_identificacion`);

--
-- Filtros para la tabla `votantes`
--
ALTER TABLE `votantes`
  ADD CONSTRAINT `fk_votante_admin_directo` FOREIGN KEY (`id_administrador_directo`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_votante_creador` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_votante_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  ADD CONSTRAINT `fk_votante_tipo_identificacion` FOREIGN KEY (`id_tipo_identificacion`) REFERENCES `tipos_identificacion` (`id_tipo_identificacion`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
