export type ProjectFile = {
  id: string;
  originalName: string;
  name: string;
  kind: "CLIENT_UPLOAD" | "DELIVERABLE";
  size: string;
  status: "UPLOADING" | "SCANNING" | "AVAILABLE" | "REJECTED" | "FAILED";
  version: number;
  createdAt: string;
  uploadedById?: string;
};

export type ProjectMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
};

export type Project = {
  id: string;
  serviceType: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  assignee: { id: string; name: string; email: string } | null;
  files: ProjectFile[];
  messages: ProjectMessage[];
};

function apiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("The API URL is not configured.");
  return value;
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    // Mandated to allow secure cross-origin tmg_ai_session cookies to pass cleanly
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "message" in body) {
        const apiMessage = (body as any).message;
        if (typeof apiMessage === "string") message = apiMessage;
        else if (Array.isArray(apiMessage)) message = apiMessage.join(" ");
      }
    } catch {
      try { message = await response.text(); } catch { }
    }
    throw new Error(message);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response as unknown as T;
}

// DB-ONLY UPLOAD
export async function uploadProjectFile(
  projectId: string,
  file: File,
  token: string,
  kind: "CLIENT_UPLOAD" | "DELIVERABLE",
  onProgress: (percent: number) => void,
): Promise<void> {
  const encodedProjectId = encodeURIComponent(projectId);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  onProgress(10);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBaseUrl()}/projects/${encodedProjectId}/files/upload`);
    // Crucial for XMLHttpRequest to carry session cookies cleanly across origins
    xhr.withCredentials = true;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve(); }
      else {
        let msg = `Upload failed (${xhr.status})`;
        try { const body = JSON.parse(xhr.responseText); if (body.message) msg = body.message; } catch { }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// DB-ONLY DOWNLOAD - works on phone, opens in new tab + downloads
export async function downloadProjectFile(
  projectId: string,
  fileId: string,
  token: string,
): Promise<void> {
  const encodedProjectId = encodeURIComponent(projectId);
  const encodedFileId = encodeURIComponent(fileId);

  const response = await fetch(`${apiBaseUrl()}/projects/${encodedProjectId}/files/${encodedFileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include", // Appended for secure file streaming
    cache: "no-store",
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(txt || `Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = "download";
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  const isPreviewable = blob.type.includes("pdf") || blob.type.includes("image");
  const url = URL.createObjectURL(blob);

  if (isPreviewable) {
    window.open(url, "_blank");
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// --- DELETE FILE ---
export async function deleteProjectFile(
  projectId: string,
  fileId: string,
  token: string,
): Promise<void> {
  await apiRequest(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`, token, {
    method: "DELETE",
  });
}

// --- DELETE MESSAGE ---
export async function deleteProjectMessage(
  projectId: string,
  messageId: string,
  token: string,
): Promise<void> {
  await apiRequest(`/projects/${encodeURIComponent(projectId)}/messages/${encodeURIComponent(messageId)}`, token, {
    method: "DELETE",
  });
}
