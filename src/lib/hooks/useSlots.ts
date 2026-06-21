"use client";

import useSWR from "swr";
import type { SlotData } from "@/components/slots/SlotCard";

export type SlotsResponse = { slots: SlotData[] };

const SLOTS_ENDPOINT = "/api/slots";
const REFRESH_INTERVAL = 8000;

// Fetcher robusto: chequea response.ok antes de parsear JSON.
// Sin esto, un 401/500 intenta parsearse como JSON y rompe silenciosamente.
async function slotsFetcher(url: string): Promise<SlotsResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error ${res.status} al cargar los slots`);
  }
  return res.json();
}

/**
 * Hook compartido para el polling de slots.
 * Centraliza el endpoint, el fetcher robusto y las opciones de SWR
 * (refreshInterval) que antes estaban duplicadas en cada componente.
 */
export function useSlots(initialData?: SlotsResponse) {
  return useSWR<SlotsResponse>(SLOTS_ENDPOINT, slotsFetcher, {
    fallbackData: initialData,
    refreshInterval: REFRESH_INTERVAL,
  });
}
