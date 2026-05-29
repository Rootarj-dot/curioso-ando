ALTER TABLE `users` ADD `accessStatus` enum('active','blocked') NOT NULL DEFAULT 'active';
--> statement-breakpoint
UPDATE `users`
SET `role` = 'user'
WHERE `role` = 'admin'
  AND LOWER(COALESCE(`email`, '')) NOT IN ('shuraand@gmail.com', 'mechanicmurry23@gmail.com');
--> statement-breakpoint
UPDATE `users`
SET `role` = 'admin', `accessStatus` = 'active'
WHERE LOWER(COALESCE(`email`, '')) IN ('shuraand@gmail.com', 'mechanicmurry23@gmail.com');
