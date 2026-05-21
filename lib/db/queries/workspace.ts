"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";

import type { Workspace } from "@/types/db";

import { db } from "..";
import { collaborators, users, workspaces } from "../schema";

/**
 * Create workspace
 * @param workspace Workspace
 * @returns Created workspace
 */
export async function createWorkspace(workspace: Workspace) {
  try {
    const [data] = await db.insert(workspaces).values(workspace).returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create Workspace.");
  } finally {
    revalidateTag("get_private_workspaces");
    revalidateTag("get_collaborating_workspaces");
    revalidateTag("get_shared_workspaces");
  }
}

export async function updateWorkspaceTitle(workspaceId: string, title: string) {
  try {
    const [data] = await db
      .update(workspaces)
      .set({ title })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return data;
  } catch (error) {
    console.error((error as Error).message);
    throw new Error("Failed to rename workspace.");
  } finally {
    revalidateTag("get_private_workspaces");
    revalidateTag("get_collaborating_workspaces");
    revalidateTag("get_shared_workspaces");
  }
}

export async function moveWorkspaceToTrash(workspaceId: string) {
  try {
    const [data] = await db
      .update(workspaces)
      .set({ inTrash: true })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return data;
  } catch (error) {
    console.error((error as Error).message);
    throw new Error("Failed to move workspace to trash.");
  } finally {
    revalidateTag("get_private_workspaces");
    revalidateTag("get_collaborating_workspaces");
    revalidateTag("get_shared_workspaces");
  }
}

export async function getWorkspaceCollaborators(workspaceId: string) {
  try {
    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(collaborators)
      .innerJoin(users, eq(collaborators.userId, users.id))
      .where(eq(collaborators.workspaceId, workspaceId));

    return data;
  } catch (error) {
    console.error((error as Error).message);
    throw new Error("Failed to fetch collaborators.");
  }
}

export async function inviteWorkspaceCollaborator(
  workspaceId: string,
  email: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, normalizedEmail),
  });

  if (!user) {
    throw new Error(
      "No account found for this email. They must sign up on ScribeFlow first, then you can invite them."
    );
  }

  const existingCollaborator = await db.query.collaborators.findFirst({
    where: (c, { and, eq }) =>
      and(eq(c.workspaceId, workspaceId), eq(c.userId, user.id)),
  });

  if (existingCollaborator) {
    throw new Error("User is already a collaborator.");
  }

  await db.insert(collaborators).values({
    workspaceId,
    userId: user.id,
  });

  revalidateTag("get_collaborating_workspaces");
  revalidateTag("get_shared_workspaces");

  return user;
}

export async function removeWorkspaceCollaborator(
  workspaceId: string,
  userId: string
) {
  await db
    .delete(collaborators)
    .where(and(eq(collaborators.workspaceId, workspaceId), eq(collaborators.userId, userId)));

  revalidateTag("get_collaborating_workspaces");
  revalidateTag("get_shared_workspaces");
}

export async function canAccessWorkspace(workspaceId: string, userId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: (w, { and, eq }) =>
      and(eq(w.id, workspaceId), eq(w.inTrash, false)),
  });

  if (!workspace) return false;
  if (workspace.workspaceOwnerId === userId) return true;

  const collaborator = await db.query.collaborators.findFirst({
    where: (c, { and, eq }) =>
      and(eq(c.workspaceId, workspaceId), eq(c.userId, userId)),
  });

  return Boolean(collaborator);
}

/**
 * @param userID User ID
 * @returns Private workspaces
 */
export const getPrivateWorkspaces = cache(
  async (userID: string) => {
    try {
      const data = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.workspaceOwnerId, userID),
            eq(workspaces.inTrash, false),
            notExists(
              db
                .select()
                .from(collaborators)
                .where(eq(collaborators.workspaceId, workspaces.id))
            )
          )
        );

      return data;
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch private workspaces!");
    }
  },
  ["get_private_workspaces"],
  { tags: ["get_private_workspaces"] }
);

/**
 * @param userId User ID
 * @returns Collaborating workspaces
 */
export const getCollaboratingWorkspaces = cache(
  async (userId: string) => {
    try {
      const data = await db
        .select()
        .from(users)
        .innerJoin(collaborators, eq(users.id, collaborators.userId))
        .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
        .where(and(eq(users.id, userId), eq(workspaces.inTrash, false)));

      return data.map(({ workspaces }) => workspaces);
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch collaborating workspaces!");
    }
  },
  ["get_collaborating_workspaces"],
  { tags: ["get_collaborating_workspaces"] }
);

/**
 * @param userId User ID
 * @returns Shared workspaces
 */
export const getSharedWorkspaces = cache(
  async (userId: string) => {
    try {
      const data = await db
        .selectDistinct()
        .from(workspaces)
        .orderBy(workspaces.createdAt)
        .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
        .where(
          and(
            eq(workspaces.workspaceOwnerId, userId),
            eq(workspaces.inTrash, false)
          )
        );

      return data.map(({ workspaces }) => workspaces);
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch shared workspaces!");
    }
  },
  ["get_shared_workspaces"],
  { tags: ["get_shared_workspaces"] }
);
