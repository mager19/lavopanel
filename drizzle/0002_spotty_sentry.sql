ALTER TABLE `service_orders` ADD `commission_percent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `liquidated_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `commission_percent` integer DEFAULT 0 NOT NULL;