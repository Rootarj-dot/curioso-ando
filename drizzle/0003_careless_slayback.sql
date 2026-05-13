CREATE TABLE `datos_curiosos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`contenido` text NOT NULL,
	`icono` varchar(10) DEFAULT '💡',
	`color` varchar(30) DEFAULT '#7C3AED',
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datos_curiosos_id` PRIMARY KEY(`id`)
);
