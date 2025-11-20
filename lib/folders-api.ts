const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FolderResponse {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFolderRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export interface MoveDebateRequest {
  debate_id: string;
  folder_id?: string | null;
}

export async function createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao criar pasta');
  }

  return response.json();
}

export async function listFolders(): Promise<{ folders: FolderResponse[] }> {
  const response = await fetch(`${API_BASE_URL}/api/folders`);

  if (!response.ok) {
    throw new Error('Erro ao listar pastas');
  }

  return response.json();
}

export async function updateFolder(
  folderId: string,
  data: UpdateFolderRequest
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao atualizar pasta');
  }

  return response.json();
}

export async function deleteFolder(folderId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao deletar pasta');
  }

  return response.json();
}

export async function moveDebateToFolder(
  debateId: string,
  folderId: string | null
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/folders/move-debate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      debate_id: debateId,
      folder_id: folderId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao mover debate');
  }

  return response.json();
}

