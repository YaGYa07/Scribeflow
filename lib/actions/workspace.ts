"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canAccessWorkspace,
  getWorkspaceCollaborators,
  inviteWorkspaceCollaborator,
  moveWorkspaceToTrash,
  removeWorkspaceCollaborator,
  updateWorkspaceTitle,
} from "@/lib/db/queries/workspace";
import { workspaces } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("You must be logged in.");
  }
  return user;
}

async function requireWorkspaceAccess(workspaceId: string, userId: string) {
  const hasAccess = await canAccessWorkspace(workspaceId, userId);
  if (!hasAccess) {
    throw new Error("You do not have access to this workspace.");
  }
}

async function requireWorkspaceOwner(workspaceId: string, userId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: (w, { eq }) => eq(w.id, workspaceId),
  });

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  if (workspace.workspaceOwnerId !== userId) {
    throw new Error("Only the workspace owner can manage collaborators.");
  }
}

export async function getWorkspaceCollaboratorsAction(workspaceId: string) {
  try {
    const user = await requireUser();
    await requireWorkspaceAccess(workspaceId, user.id);
    const data = await getWorkspaceCollaborators(workspaceId);
    return { ok: true as const, data };
  } catch (error) {
    return {
      ok: false as const,
      error: (error as Error).message || "Failed to load collaborators.",
    };
  }
}

export async function inviteWorkspaceCollaboratorAction(
  workspaceId: string,
  email: string
): Promise<ActionResult<{ id: string; email: string; name: string | null }>> {
  try {
    const user = await requireUser();
    await requireWorkspaceOwner(workspaceId, user.id);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, error: "Enter an email address." };
    }

    if (normalizedEmail === user.email?.toLowerCase()) {
      return { ok: false, error: "You cannot invite yourself." };
    }

    const invited = await inviteWorkspaceCollaborator(
      workspaceId,
      normalizedEmail
    );

    return {
      ok: true,
      data: {
        id: invited.id,
        email: invited.email,
        name: invited.name,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message || "Failed to invite collaborator.",
    };
  }
}

export async function removeWorkspaceCollaboratorAction(
  workspaceId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireWorkspaceOwner(workspaceId, user.id);

    if (userId === user.id) {
      return { ok: false, error: "You cannot remove yourself as owner." };
    }

    await removeWorkspaceCollaborator(workspaceId, userId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message || "Failed to remove collaborator.",
    };
  }
}

export async function updateWorkspaceTitleAction(
  workspaceId: string,
  title: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireWorkspaceOwner(workspaceId, user.id);

    const nextTitle = title.trim();
    if (nextTitle.length < 3) {
      return { ok: false, error: "Workspace name must be at least 3 characters." };
    }

    await updateWorkspaceTitle(workspaceId, nextTitle);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message || "Failed to rename workspace.",
    };
  }
}

export async function moveWorkspaceToTrashAction(
  workspaceId: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireWorkspaceOwner(workspaceId, user.id);

    await moveWorkspaceToTrash(workspaceId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message || "Failed to move workspace to trash.",
    };
  }
}
