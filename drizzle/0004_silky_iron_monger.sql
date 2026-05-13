CREATE TABLE `article_trivia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`pregunta` varchar(500) NOT NULL,
	`respuesta` text NOT NULL,
	`opcionCorrecta` varchar(255) NOT NULL,
	`opcionIncorrecta` varchar(255) NOT NULL,
	`icono` varchar(50) DEFAULT 'HelpCircle',
	`color` varchar(30) DEFAULT '#7C3AED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `article_trivia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `datos_curiosos` MODIFY COLUMN `icono` varchar(50) DEFAULT 'Lightbulb';