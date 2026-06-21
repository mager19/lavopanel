ALTER TABLE `service_orders` ADD `kind` text DEFAULT 'wash' NOT NULL;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `parking_rate_type` text;--> statement-breakpoint
ALTER TABLE `service_orders` ADD `parking_rate` integer;