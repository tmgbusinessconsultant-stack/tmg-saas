export type ProjectFile = {
  id: string;
  originalName: string;
  kind: "CLIENT_UPLOAD" | "DELIVERABLE";
  size: string;
  status: "UPLOADING" | "SCANNING" | "AVAILABLE" | "REJECTED" | "FAILED";
  version: number;
  createdAt: string;
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

type UploadInit = {
  id: string;
  partSize: number;
  partCount: number;
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
        const apiMessage = body.message;
        if (typeof apiMessage === "string") message = apiMessage;
        else if (Array.isArray(apiMessage)) message = apiMessage.join(" ");
      }
    } catch {
      // Keep the HTTP status as the explicit fallback when the response is not JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  token: string,
  kind: "CLIENT_UPLOAD" | "DELIVERABLE",
  onProgress: (percent: number) => void,
): Promise<void> {
  const encodedProjectId = encodeURIComponent(projectId);
  const upload = await apiRequest<UploadInit>(`/projects/${encodedProjectId}/files`, token, {
    method: "POST",
    body: JSON.stringify({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      kind,
    }),
  });

  const parts: Array<{ partNumber: number; etag: string }> = [];
  try {
    let nextPart = 1;
    let completedParts = 0;
    const worker = async () => {
      while (true) {
        const partNumber = nextPart++;
        if (partNumber > upload.partCount) return;
        const start = (partNumber - 1) * upload.partSize;
        const chunk = file.slice(start, Math.min(start + upload.partSize, file.size));
        const { url } = await apiRequest<{ url: string }>(
          `/projects/${encodedProjectId}/files/${encodeURIComponent(upload.id)}/parts/${partNumber}`,
          token,
          { method: "POST" },
        );
        const response = await fetch(url, { method: "PUT", body: chunk });
        if (!response.ok) {
          throw new Error(`Storage rejected upload part ${partNumber} (${response.status}).`);
        }
        const etag = response.headers.get("ETag");
        if (!etag) {
          throw new Error("Storage did not return an ETag. Check the S3 bucket CORS expose headers.");
        }
        parts.push({ partNumber, etag });
        completedParts++;
        onProgress(Math.round((completedParts / upload.partCount) * 100));
      }
    };

    await Promise.all(Array.from({ length: Math.min(3, upload.partCount) }, () => worker()));
    parts.sort((a, b) => a.partNumber - b.partNumber);
    await apiRequest(
      `/projects/${encodedProjectId}/files/${encodeURIComponent(upload.id)}/complete`,
      token,
      { method: "POST", body: JSON.stringify({ parts }) },
    );
  } catch (uploadError) {
    try {
      await apiRequest(
        `/projects/${encodedProjectId}/files/${encodeURIComponent(upload.id)}/abort`,
        token,
        { method: "POST" },
      );
    } catch (abortError) {
      console.error("Could not abort the incomplete multipart upload.", abortError);
      throw new AggregateError(
        [uploadError, abortError],
        "The file upload failed and storage cleanup also failed. Contact support before retrying.",
      );
    }
    throw uploadError;
  }
}

export async function downloadProjectFile(
  projectId: string,
  fileId: string,
  token: string,
): Promise<void> {
  const result = await apiRequest<{ url: string }>(
    `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/download`,
    token,
  );
  window.location.assign(result.url);
}
