"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileIcon } from "lucide-react";
import { toast } from "sonner";

import { useAppState } from "@/hooks/use-app-state";
import { updateFileInDb } from "@/lib/db/queries";

export default function FilePage() {
  const params = useParams<{ fileId: string }>();
  const { files, updateFile } = useAppState();

  const file = useMemo(
    () => files.find((item) => item.id === params.fileId),
    [files, params.fileId]
  );
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedValue, setLastSavedValue] = useState("");

  useEffect(() => {
    const initialValue = file?.data ?? "";
    setDraft(initialValue);
    setLastSavedValue(initialValue);
  }, [file?.data, file?.id]);

  const isDirty = draft !== lastSavedValue;

  const saveFileContent = useCallback(async (showToast = true) => {
    if (!file) return;
    const updated = { ...file, data: draft };

    setIsSaving(true);
    updateFile(updated);

    try {
      await updateFileInDb(updated);
      setLastSavedValue(draft);
      if (showToast) {
        toast.success("File saved.");
      }
    } catch {
      if (showToast) {
        toast.error("Failed to save file.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [draft, file, updateFile]);

  useEffect(() => {
    if (!file || !isDirty || isSaving) return;

    const timeout = setTimeout(() => {
      void saveFileContent(false);
    }, 900);

    return () => clearTimeout(timeout);
  }, [draft, isDirty, isSaving, file, saveFileContent]);

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileIcon className="size-4 text-muted-foreground" />
          <h1 className="truncate text-lg font-semibold">
            {file?.iconId ? `${file.iconId} ` : ""}
            {file?.title ?? "Untitled file"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          File ID: {params.fileId}
        </p>
      </div>

      <section className="rounded-lg border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Content {isDirty ? "• Unsaved changes" : "• Saved"}
          </h2>
          <button
            type="button"
            onClick={() => void saveFileContent()}
            disabled={isSaving || !file || !isDirty}
            className="rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Start writing your notes here..."
          className="min-h-64 w-full rounded-md border bg-muted/40 p-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </section>
    </div>
  );
}
