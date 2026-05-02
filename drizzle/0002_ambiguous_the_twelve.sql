CREATE TABLE `site_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `articles` MODIFY COLUMN `content` text;