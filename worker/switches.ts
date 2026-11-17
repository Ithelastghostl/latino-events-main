// Cutover switches (MIGRATION-PLAN 2.8). Only the exact string "true" opens a switch;
// missing, "false", "maintenance" or anything else keeps it closed.
export const isOpen = (value: string | undefined): boolean => value === "true";

export const MAINTENANCE_MESSAGE = "La Tribu is down for a short maintenance. Please try again in a few minutes.";
