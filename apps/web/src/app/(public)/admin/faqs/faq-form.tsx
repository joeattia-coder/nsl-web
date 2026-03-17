"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import NewsRichTextEditor from "@/components/admin/NewsRichTextEditor";

type FaqFormMode = "create" | "edit";

type FaqItem = {
  id: string;
  question: string;
  answerHtml: string;
  answerJson: unknown;
  sortOrder: number;
  isPublished: boolean;
};

type FaqFormProps = {
  mode: FaqFormMode;
  faqId?: string;
};

export default function FaqForm({ mode, faqId }: FaqFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answerHtml, setAnswerHtml] = useState("<p></p>");
  const [answerJson, setAnswerJson] = useState<unknown>(null);
  const [sortOrder, setSortOrder] = useState("0");
  const [isPublished, setIsPublished] = useState(true);

  // Load next sort order for new FAQs
  useEffect(() => {
    if (isEdit || mode !== "create") return;

    async function loadNextSortOrder() {
      try {
        const response = await fetch("/api/faqs", { cache: "no-store" });
        const data: { faqs?: Array<{ sortOrder: number }> } | null = await response.json().catch(() => null);

        if (response.ok && data?.faqs) {
          const maxSortOrder = Math.max(...data.faqs.map((f) => f.sortOrder), -1);
          setSortOrder(String(maxSortOrder + 1));
        }
      } catch (err) {
        console.error("Failed to load max sort order:", err);
      }
    }

    void loadNextSortOrder();
  }, [isEdit, mode]);

  useEffect(() => {
    if (!isEdit || !faqId) return;

    async function loadFaq() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/faqs/${faqId}`, { cache: "no-store" });
        const data: FaqItem | { error?: string; details?: string } | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (data as { details?: string; error?: string } | null)?.details ||
            (data as { error?: string } | null)?.error ||
            "Failed to fetch FAQ.";
          throw new Error(message);
        }

        const faq = data as FaqItem;
        setQuestion(faq.question ?? "");
        setAnswerHtml(faq.answerHtml ?? "<p></p>");
        setAnswerJson(faq.answerJson ?? null);
        setSortOrder(String(faq.sortOrder ?? 0));
        setIsPublished(Boolean(faq.isPublished));
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load FAQ.");
      } finally {
        setLoading(false);
      }
    }

    void loadFaq();
  }, [faqId, isEdit]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const payload = {
        question: question.trim(),
        answerHtml,
        answerJson,
        sortOrder,
        isPublished,
      };

      const response = await fetch(isEdit ? `/api/faqs/${faqId}` : "/api/faqs", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.details || data?.error || (isEdit ? "Failed to update FAQ." : "Failed to create FAQ.")
        );
      }

      router.push("/admin/faqs");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "Failed to update FAQ."
            : "Failed to create FAQ."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading FAQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? "Edit FAQ" : "Add FAQ"}</h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update question wording, answer content, and publishing details."
              : "Create a new frequently asked question with a rich text answer."}
          </p>
        </div>

        <Link href="/admin/faqs" className="admin-player-form-button admin-player-form-button-secondary">
          <FiArrowLeft />
          <span>Back to FAQs</span>
        </Link>
      </div>

      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="faq-question" className="admin-label">
                  Question Title
                </label>
                <input
                  id="faq-question"
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="Example: How do I register for a tournament?"
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Answer</label>
                <NewsRichTextEditor
                  initialContent={answerHtml}
                  placeholder="Write the FAQ answer here..."
                  statusLabel="Formatted FAQ answer"
                  onChange={({ html, json }) => {
                    setAnswerHtml(html);
                    setAnswerJson(json);
                  }}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="faq-order" className="admin-label">
                  Sort Order
                </label>
                <input
                  id="faq-order"
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="0"
                />
              </div>

              <div className="admin-form-field rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(event) => setIsPublished(event.target.checked)}
                  />
                  <span>Published (visible to public FAQ consumers)</span>
                </label>
              </div>
            </div>

            <div className="admin-form-actions admin-player-form-actions">
              <button
                type="submit"
                className="admin-player-form-button admin-player-form-button-primary"
                disabled={saving}
              >
                <FiSave />
                <span>{saving ? "Saving..." : isEdit ? "Save Changes" : "Create FAQ"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
