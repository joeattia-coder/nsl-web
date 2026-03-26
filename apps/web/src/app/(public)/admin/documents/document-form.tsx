"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { formatDateTimeInAdminTimeZone } from "@/lib/timezone";
import { FiArrowLeft, FiPlus, FiSave, FiUpload, FiX } from "react-icons/fi";

type DocumentFormMode = "create" | "edit";

type DocumentRecord = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  showOnPublicDocumentsPage: boolean;
  createdAt: string;
  updatedAt: string;
};

type DocumentFormProps = {
  mode: DocumentFormMode;
  documentId?: string;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatDateTime(value: string) {
  return formatDateTimeInAdminTimeZone(value) || value;
}

export default function DocumentForm({ mode, documentId }: DocumentFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [showOnPublicDocumentsPage, setShowOnPublicDocumentsPage] = useState(true);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    if (!isEdit || !documentId) return;

    async function loadDocument() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/documents/${documentId}`, { cache: "no-store" });
        const data: DocumentRecord | { error?: string; details?: string } | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { details?: string; error?: string } | null)?.details ||
              (data as { error?: string } | null)?.error ||
              "Failed to fetch document."
          );
        }

        const document = data as DocumentRecord;
        setTitle(document.title ?? "");
        setShowOnPublicDocumentsPage(Boolean(document.showOnPublicDocumentsPage));
        setFileUrl(document.fileUrl ?? "");
        setFileName(document.fileName ?? "");
        setMimeType(document.mimeType ?? "");
        setSizeBytes(document.sizeBytes ?? null);
        setCreatedAt(document.createdAt);
        setUpdatedAt(document.updatedAt);
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load document.");
      } finally {
        setLoading(false);
      }
    }

    void loadDocument();
  }, [documentId, isEdit]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF and common office document files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Document is too large. Maximum size is 25 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedFile(file);
    setSizeBytes(file.size);
  }

  async function uploadFileIfNeeded() {
    if (!selectedFile) {
      return {
        fileUrl,
        fileName,
        mimeType,
        sizeBytes,
      };
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to upload document.");
      }

      return {
        fileUrl: String(data?.url ?? ""),
        fileName: String(data?.fileName ?? selectedFile.name),
        mimeType: String(data?.mimeType ?? selectedFile.type),
        sizeBytes: Number(data?.sizeBytes ?? selectedFile.size),
      };
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      if (!title.trim()) {
        throw new Error("Title is required.");
      }

      if (!selectedFile && !fileUrl.trim()) {
        throw new Error("Please upload a document file.");
      }

      const uploaded = await uploadFileIfNeeded();

      if (!uploaded.fileUrl.trim()) {
        throw new Error("Please upload a document file.");
      }

      const payload = {
        title: title.trim(),
        fileUrl: uploaded.fileUrl.trim(),
        fileName: uploaded.fileName.trim() || null,
        mimeType: uploaded.mimeType.trim() || null,
        sizeBytes: uploaded.sizeBytes,
        showOnPublicDocumentsPage,
      };

      const response = await fetch(isEdit ? `/api/documents/${documentId}` : "/api/documents", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.details || data?.error || (isEdit ? "Failed to update document." : "Failed to create document.")
        );
      }

      router.push("/admin/documents");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "Failed to update document."
            : "Failed to create document."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? "Edit Document" : "Add Document"}</h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update document details, file attachment, and public visibility."
              : "Upload PDF and office documents and control public visibility."}
          </p>
        </div>

        <Link href="/admin/documents" className="admin-player-form-button admin-player-form-button-secondary">
          <FiArrowLeft />
          <span>Back to Documents</span>
        </Link>
      </div>

      <div className="admin-card admin-player-form-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {error ? <p className="admin-form-error">{error}</p> : null}

          <div className="admin-form-grid">
            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="document-title" className="admin-label">
                Title
              </label>
              <input
                id="document-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label">Upload Document</label>
              <div className="admin-upload-panel">
                <button
                  type="button"
                  className="admin-player-form-button admin-player-form-button-secondary admin-player-form-button-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FiUpload />
                  <span>{selectedFile ? "Change File" : "Select File"}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="admin-upload-help">
                  {selectedFile
                    ? `${selectedFile.name} selected and ready to upload on save.`
                    : fileName
                      ? `${fileName} is currently attached.`
                      : "Upload PDF and office files up to 25 MB."}
                </div>
                {(selectedFile || fileUrl) ? (
                  <button
                    type="button"
                    className="admin-player-form-button admin-player-form-button-danger"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileUrl("");
                      setFileName("");
                      setMimeType("");
                      setSizeBytes(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <FiX />
                    <span>Remove File</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="admin-form-field admin-form-field-full rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="admin-checkbox-inline">
                <input
                  type="checkbox"
                  checked={showOnPublicDocumentsPage}
                  onChange={(event) => setShowOnPublicDocumentsPage(event.target.checked)}
                />
                <span>Show On Public Documents Page</span>
              </label>
            </div>

            {isEdit ? (
              <>
                <div className="admin-form-field">
                  <label className="admin-label">Create Date</label>
                  <input
                    type="text"
                    value={createdAt ? formatDateTime(createdAt) : ""}
                    className="admin-input admin-player-form-input"
                    readOnly
                  />
                </div>

                <div className="admin-form-field">
                  <label className="admin-label">Modified At</label>
                  <input
                    type="text"
                    value={updatedAt ? formatDateTime(updatedAt) : ""}
                    className="admin-input admin-player-form-input"
                    readOnly
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="admin-form-actions admin-player-form-actions">
            <Link href="/admin/documents" className="admin-player-form-button admin-player-form-button-secondary">
              <FiX />
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              className={`admin-player-form-button ${
                isEdit ? "admin-player-form-button-primary" : "admin-player-form-button-create"
              }`}
              disabled={saving || uploading}
            >
              {isEdit ? <FiSave /> : <FiPlus />}
              <span>
                {uploading
                  ? "Uploading Document..."
                  : saving
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save Changes"
                      : "Save Document"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
