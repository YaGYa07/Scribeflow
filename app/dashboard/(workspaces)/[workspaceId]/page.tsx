"use client";

import { FolderIcon, FileIcon } from "lucide-react";

import { useAppState } from "@/hooks/use-app-state";

export default function WorkspacePage() {
  const { folders, files } = useAppState();
  const activeFolders = folders.filter((folder) => !folder.inTrash);
  const activeFiles = files.filter((file) => !file.inTrash);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Manage your folders and files from the sidebar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Folders</p>
          <p className="mt-1 text-2xl font-semibold">{activeFolders.length}</p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Files</p>
          <p className="mt-1 text-2xl font-semibold">{activeFiles.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 flex items-center gap-2 font-medium">
            <FolderIcon className="size-4" />
            Recent folders
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activeFolders.length ?
              activeFolders.slice(0, 5).map((folder) => (
                <li key={folder.id} className="truncate">
                  {folder.iconId ? `${folder.iconId} ` : ""}
                  {folder.title}
                </li>
              ))
            : <li>No folders yet.</li>}
          </ul>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 flex items-center gap-2 font-medium">
            <FileIcon className="size-4" />
            Recent files
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {activeFiles.length ?
              activeFiles.slice(0, 5).map((file) => (
                <li key={file.id} className="truncate">
                  {file.iconId ? `${file.iconId} ` : ""}
                  {file.title}
                </li>
              ))
            : <li>No files yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
