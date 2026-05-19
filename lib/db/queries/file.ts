"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { validate } from "uuid";

import type { File } from "@/types/db";

import { db } from "..";
import { files } from "../schema";

export type UpdateFileResult =
  | { ok: true; file: File }
  | { ok: false; error: "VERSION_CONFLICT" };

/**
 * Create a new file
 * @param file - File object
 * @returns Created file
 */
export async function createFile(file: File) {
  try {
    const [data] = await db.insert(files).values(file).returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create file");
  } finally {
    revalidateTag("get_files");
  }
}

/**
 * Get a single file by ID
 */
export async function getFileById(fileId: string) {
  const isValid = validate(fileId);
  if (!isValid) {
    throw new Error("Invalid file ID");
  }

  try {
    const [data] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    return data ?? null;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to fetch file from the database");
  }
}

/**
 * Get all files in a workspace
 * @param workspaceId - ID of the workspace
 * @returns List of files in the workspace
 */
export const getFiles = cache(
  async (workspaceId: string) => {
    const isValid = validate(workspaceId);

    if (!isValid) {
      throw new Error("Invalid workspace ID");
    }

    try {
      const data = await db
        .select()
        .from(files)
        .orderBy(files.createdAt)
        .where(eq(files.workspaceId, workspaceId));

      return data;
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch files from the database");
    }
  },
  ["get_files"],
  { tags: ["get_files"] }
);

export const getFilesFromDb = getFiles;

/**
 * Update a file with optimistic concurrency (version column).
 */
export async function updateFile(file: File): Promise<UpdateFileResult> {
  if (!file.id) {
    throw new Error("File ID is required");
  }

  const expectedVersion = file.version ?? 1;

  try {
    const [updatedFile] = await db
      .update(files)
      .set({
        title: file.title,
        iconId: file.iconId,
        data: file.data,
        bannerUrl: file.bannerUrl,
        workspaceId: file.workspaceId,
        folderId: file.folderId,
        inTrash: file.inTrash,
        version: expectedVersion + 1,
      })
      .where(and(eq(files.id, file.id), eq(files.version, expectedVersion)))
      .returning();

    if (!updatedFile) {
      return { ok: false, error: "VERSION_CONFLICT" };
    }

    return { ok: true, file: updatedFile };
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to update file");
  } finally {
    revalidateTag("get_files");
  }
}

/** @deprecated Use updateFile; kept for imports that expect the server action name */
export const updateFileInDb = updateFile;

/**
 * Delete file by ID
 * @param fileId Folder ID
 * @returns Deleted file
 */
export async function deleteFile(fileId: string) {
  try {
    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, fileId))
      .returning();

    return deletedFile;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to delete file");
  }
}

export const deleteFileFromDb = deleteFile;
