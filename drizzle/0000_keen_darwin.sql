CREATE TABLE `business_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_config_key_unique` ON `business_config` (`key`);--> statement-breakpoint
CREATE TABLE `monthly_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`price_snapshot` integer NOT NULL,
	`qty` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `service_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parking_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_type_id` integer NOT NULL,
	`rate_type` text NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parking_rates_type_unique` ON `parking_rates` (`vehicle_type_id`,`rate_type`);--> statement-breakpoint
CREATE TABLE `service_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`slot_id` integer,
	`employee_id` integer,
	`shift_id` integer,
	`status` text DEFAULT 'received' NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`delivered_at` integer,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`vehicle_type_id` integer,
	`price` integer NOT NULL,
	`estimated_minutes` integer,
	`position` integer,
	`active` integer DEFAULT true,
	FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`opened_at` integer DEFAULT (unixepoch()) NOT NULL,
	`opening_cash` integer NOT NULL,
	`closed_at` integer,
	`closing_cash` integer,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'free' NOT NULL,
	`position` integer,
	`active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vehicle_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`vehicle_type_id` integer,
	`owner_name` text,
	`owner_phone` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);