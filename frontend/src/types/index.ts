export interface User {
  id: string;
  name: string;
  email: string;
}

export type DocumentRole = "owner" | "editor" | "viewer";

export interface DocumentSummary {
  _id: string;
  title: string;
  role: DocumentRole;
  updatedAt: string;
  createdAt: string;
  collaboratorCount: number;
}

export interface DocumentVersion {
  _id: string;
  label: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  isAutosave: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
