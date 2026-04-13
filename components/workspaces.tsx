import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderIcon, LayoutGrid, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { useAppState } from "@/hooks/use-app-state";
import {
  getWorkspaceCollaborators,
  inviteWorkspaceCollaborator,
  moveWorkspaceToTrash,
  removeWorkspaceCollaborator,
  updateWorkspaceTitle,
} from "@/lib/db/queries";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type WorkspaceCollaborator = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export function Workspaces() {
  const pathname = usePathname();
  const router = useRouter();
  const { folders, files, user } = useAppState();
  const workspaceId = pathname.split("/")[2];
  const [collaborators, setCollaborators] = useState<WorkspaceCollaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [workspaceTitle, setWorkspaceTitle] = useState("");

  const activeFolders = folders.filter((folder) => !folder.inTrash);
  const activeFiles = files.filter((file) => !file.inTrash);

  async function refreshCollaborators() {
    if (!workspaceId || workspaceId === "new-workspace") {
      setCollaborators([]);
      return;
    }

    setIsLoadingCollaborators(true);
    try {
      const data = await getWorkspaceCollaborators(workspaceId);
      setCollaborators(data as WorkspaceCollaborator[]);
    } catch {
      toast.error("Failed to load collaborators.");
    } finally {
      setIsLoadingCollaborators(false);
    }
  }

  useEffect(() => {
    void refreshCollaborators();
  }, [workspaceId]);

  async function renameWorkspace() {
    if (!workspaceId || workspaceId === "new-workspace") return;
    const nextTitle = workspaceTitle.trim();
    if (nextTitle.length < 3) {
      toast.warning("Workspace name must be at least 3 characters long.");
      return;
    }

    await toast.promise(updateWorkspaceTitle(workspaceId, nextTitle), {
      loading: "Renaming workspace...",
      success: "Workspace renamed.",
      error: "Failed to rename workspace.",
    });
    setIsRenameDialogOpen(false);
  }

  async function deleteWorkspace() {
    if (!workspaceId || workspaceId === "new-workspace") return;
    try {
      await moveWorkspaceToTrash(workspaceId);
      toast.success("Workspace moved to trash.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to move workspace to trash.");
    }
  }

  async function inviteCollaborator() {
    if (!workspaceId || workspaceId === "new-workspace") return;
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteWorkspaceCollaborator(workspaceId, inviteEmail);
      toast.success("Collaborator invited.");
      setInviteEmail("");
      await refreshCollaborators();
    } catch (error) {
      toast.error((error as Error).message || "Failed to invite collaborator.");
    } finally {
      setIsInviting(false);
    }
  }

  async function removeCollaborator(userId: string) {
    if (!workspaceId || workspaceId === "new-workspace") return;

    try {
      await removeWorkspaceCollaborator(workspaceId, userId);
      toast.success("Collaborator removed.");
      await refreshCollaborators();
    } catch {
      toast.error("Failed to remove collaborator.");
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <LayoutGrid className="size-5" />
          My Workspace
        </h3>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/new-workspace">
            <Plus className="mr-1 size-4" />
            New
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border p-3">
        <p className="truncate text-sm text-muted-foreground">Workspace ID</p>
        <p className="truncate font-mono text-sm">{workspaceId ?? "-"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="sm"
          variant="outline"
          className="justify-start"
          onClick={() => {
            setWorkspaceTitle("Workspace");
            setIsRenameDialogOpen(true);
          }}
          disabled={!workspaceId || workspaceId === "new-workspace"}
        >
          <Pencil className="mr-2 size-4" />
          Rename
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              className="justify-start"
              disabled={!workspaceId || workspaceId === "new-workspace"}
            >
              <Trash2 className="mr-2 size-4" />
              Trash
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move workspace to trash?</AlertDialogTitle>
              <AlertDialogDescription>
                This workspace will be hidden from your dashboard. You can restore
                it later from database if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void deleteWorkspace()}>
                Move to trash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Folders</p>
          <p className="text-xl font-semibold">{activeFolders.length}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Files</p>
          <p className="text-xl font-semibold">{activeFiles.length}</p>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <p className="mb-2 text-sm font-medium">Recent Folders</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {activeFolders.length ?
            activeFolders.slice(0, 4).map((folder) => (
              <li key={folder.id} className="flex items-center gap-2 truncate">
                <FolderIcon className="size-3.5 shrink-0" />
                <span className="truncate">{folder.title}</span>
              </li>
            ))
          : <li>No folders yet.</li>}
        </ul>
      </div>

      <div className="rounded-lg border p-3">
        <p className="mb-2 text-sm font-medium">Collaborators</p>
        <div className="mb-3 flex gap-2">
          <Input
            type="email"
            placeholder="Invite by email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={!workspaceId || workspaceId === "new-workspace"}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void inviteCollaborator()}
            disabled={
              !workspaceId ||
              workspaceId === "new-workspace" ||
              isInviting ||
              !inviteEmail.trim()
            }
          >
            <UserPlus className="mr-1 size-4" />
            Invite
          </Button>
        </div>

        <ul className="space-y-2 text-sm">
          {isLoadingCollaborators ?
            <li className="text-muted-foreground">Loading collaborators...</li>
          : collaborators.length ?
            collaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {collaborator.name ?? collaborator.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {collaborator.email}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => void removeCollaborator(collaborator.id)}
                  disabled={collaborator.id === user?.id}
                  title={
                    collaborator.id === user?.id ?
                      "You can't remove yourself."
                    : "Remove collaborator"
                  }
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))
          : <li className="text-muted-foreground">No collaborators yet.</li>}
        </ul>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
            <DialogDescription>
              Enter a new name for this workspace.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={workspaceTitle}
            onChange={(e) => setWorkspaceTitle(e.target.value)}
            placeholder="Workspace name"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => void renameWorkspace()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
