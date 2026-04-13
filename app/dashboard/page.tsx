import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCollaboratingWorkspaces } from "@/lib/db/queries";

export const metadata = {
  title: "Dashboard",
  description: "Your workspaces",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await db.query.workspaces.findFirst({
    where: (workspace, { and, eq }) =>
      and(eq(workspace.workspaceOwnerId, user.id), eq(workspace.inTrash, false)),
  });

  if (!workspace) {
    const collaboratingWorkspaces = await getCollaboratingWorkspaces(user.id);

    if (!collaboratingWorkspaces.length) {
      redirect(`/dashboard/new-workspace`);
    }

    redirect(`/dashboard/${collaboratingWorkspaces[0].id}`);
  }

  redirect(`/dashboard/${workspace.id}`);
}
