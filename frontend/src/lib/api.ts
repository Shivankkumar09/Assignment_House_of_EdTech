import axios from "axios";
import type { AuthResponse, DocumentSummary, DocumentVersion } from "@/types";

const API_URL = "https://assignment-house-of-edtech.onrender.com/api";

export const client = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes network failures (no connection, backend down) into a single
// recognizable error so pages can fall back to cached/local state instead
// of showing a hard crash. This is central to the "local-first" contract:
// a network hiccup should degrade gracefully, never block the user.
export class OfflineError extends Error {
  constructor() {
    super("offline");
    this.name = "OfflineError";
  }
}

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      return Promise.reject(new OfflineError());
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  async signup(name: string, email: string, password: string) {
    const { data } = await client.post<AuthResponse>("/auth/signup", { name, email, password });
    return data;
  },
  async login(email: string, password: string) {
    const { data } = await client.post<AuthResponse>("/auth/login", { email, password });
    return data;
  },
  async me() {
    const { data } = await client.get<{ user: AuthResponse["user"] }>("/auth/me");
    return data.user;
  },
};

export const documentsApi = {
  async list() {
    const { data } = await client.get<{ documents: DocumentSummary[] }>("/documents");
    return data.documents;
  },
  async create(title: string) {
    const { data } = await client.post<{ document: DocumentSummary }>("/documents", { title });
    return data.document;
  },
  async rename(id: string, title: string) {
    const { data } = await client.patch<{ document: DocumentSummary }>(`/documents/${id}`, { title });
    return data.document;
  },
  async remove(id: string) {
    await client.delete(`/documents/${id}`);
  },
  async get(id: string) {
    const { data } = await client.get(`/documents/${id}`);
    return data.document as DocumentSummary & { snapshot: string | null };
  },
  async invite(id: string, email: string, role: "editor" | "viewer") {
    const { data } = await client.post(`/documents/${id}/collaborators`, { email, role });
    return data;
  },
  async versions(id: string) {
    const { data } = await client.get<{ versions: DocumentVersion[] }>(`/documents/${id}/versions`);
    return data.versions;
  },
  async saveVersion(id: string, label: string, update: string) {
    const { data } = await client.post<{ version: DocumentVersion }>(`/documents/${id}/versions`, {
      label,
      update, // base64-encoded Yjs update representing full state at this point
    });
    return data.version;
  },
  async getVersionSnapshot(id: string, versionId: string) {
    const { data } = await client.get<{ update: string }>(`/documents/${id}/versions/${versionId}`);
    return data.update;
  },
  async restoreVersion(id: string, versionId: string) {
    const { data } = await client.post(`/documents/${id}/versions/${versionId}/restore`);
    return data;
  },
};
