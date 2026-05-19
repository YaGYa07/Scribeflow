"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileIcon } from "lucide-react";
import { toast } from "sonner";

import { useAppState } from "@/hooks/use-app-state";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/editor";
import { getFileById } from "@/lib/db/queries";
import { persistFileUpdate } from "@/lib/db/update-file-client";

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

  const saveFileContent = useCallback(
    async (showToast = true) => {
      if (!file) return;
      const updated = { ...file, data: draft };

      setIsSaving(true);
      updateFile(updated);

      const result = await persistFileUpdate(updated);

      if (result.ok) {
        updateFile(result.file);
        setLastSavedValue(draft);
        if (showToast) {
          toast.success("File saved.");
        }
      } else if (result.error === "VERSION_CONFLICT" && file.id) {
        const latest = await getFileById(file.id);
        if (latest) {
          updateFile(latest);
          const serverContent = latest.data ?? "";
          setDraft(serverContent);
          setLastSavedValue(serverContent);
        }
        toast.error(
          "This file was updated elsewhere. Your view was refreshed from the server."
        );
      } else if (showToast) {
        toast.error("Failed to save file.");
      }

      setIsSaving(false);
    },
    [draft, file, updateFile]
  );

  useEffect(() => {
    if (!file || !isDirty || isSaving) return;

    const timeout = setTimeout(() => {
      void saveFileContent(false);
    }, AUTOSAVE_DEBOUNCE_MS);

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
          {file?.version != null ? ` · Version ${file.version}` : null}
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
