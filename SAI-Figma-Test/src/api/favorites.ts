import { apiRequest } from "./client";
import { PropertyItem } from "./properties";

export async function fetchFavorites(): Promise<PropertyItem[]> {
  return apiRequest<PropertyItem[]>("/favorites/");
}

export const getFavorites = fetchFavorites;


export async function addFavorite(propertyId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/favorites/${propertyId}`, {
    method: "POST",
  });
}

export async function removeFavorite(propertyId: number): Promise<void> {
  return apiRequest<void>(`/favorites/${propertyId}`, {
    method: "DELETE",
  });
}
