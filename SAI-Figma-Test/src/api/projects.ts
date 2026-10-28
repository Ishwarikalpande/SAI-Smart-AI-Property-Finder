import { apiRequest } from "./client";

export interface UnitResponse {
  id: number;
  project_id: number;
  floor_id?: number | null;
  unit_number: string;
  unit_type: string;
  carpet_area: number;
  price: number;
  status: "available" | "reserved" | "sold" | "booked";
}

export interface BuildingResponse {
  id: number;
  project_id: number;
  name: string;
  total_floors: number;
}

export interface ProjectResponse {
  id: number;
  builder_id: number;
  name: string;
  description?: string;
  city: string;
  locality: string;
  total_units: number;
  status: string;
  created_at: string;
  buildings?: BuildingResponse[];
  units?: UnitResponse[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
  city: string;
  locality: string;
  total_units: number;
}

export interface UnitCreate {
  floor_id?: number | null;
  unit_number: string;
  unit_type: string;
  carpet_area: number;
  price: number;
  status?: string;
}

export async function fetchPublicProjects(city?: string): Promise<ProjectResponse[]> {
  const q = city ? `?city=${encodeURIComponent(city)}` : "";
  return apiRequest<ProjectResponse[]>(`/projects/${q}`);
}

export async function createPublicProject(payload: ProjectCreate): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>("/projects/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPublicProjectById(id: number): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/projects/${id}`);
}

export async function addPublicProjectUnit(projectId: number, payload: UnitCreate): Promise<UnitResponse> {
  return apiRequest<UnitResponse>(`/projects/${projectId}/units`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
