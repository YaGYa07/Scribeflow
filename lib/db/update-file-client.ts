import type { File } from "@/types/db";
import type { UpdateFileResult } from "@/lib/db/queries/file";
import { updateFileInDb } from "@/lib/db/queries";

/**
 * Client-side helper: applies updateFile result to local store or returns conflict.
 */
export async function persistFileUpdate(
  file: File
): Promise<
  | { ok: true; file: File }
  | { ok: false; error: "VERSION_CONFLICT" }
  | { ok: false; error: "UNKNOWN" }
> {
  try {
    const result: UpdateFileResult = await updateFileInDb(file);
    if (!result.ok) {
      return result;
    }
    return { ok: true, file: result.file };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

/** For toast.promise and other callers that expect a thrown error on failure */
export async function updateFileResolved(file: File): Promise<File> {
  const result = await persistFileUpdate(file);
  if (!result.ok) {
    if (result.error === "VERSION_CONFLICT") {
      throw new Error("File was updated in another session. Please refresh.");
    }
    throw new Error("Failed to update file");
  }
  return result.file;
}
