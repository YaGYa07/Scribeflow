export type DBResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

// NOTE:
// avoid star export, causing warning
// ```The requested module '...' contains conflicting star exports for the name '$$ACTION_0' with the previous requested module '...'```

export {
  canAccessWorkspace,
  createWorkspace,
  getWorkspaceCollaborators,
  getCollaboratingWorkspaces,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  inviteWorkspaceCollaborator,
  moveWorkspaceToTrash,
  removeWorkspaceCollaborator,
  updateWorkspaceTitle,
} from "./workspace";
export {
  createFolder,
  createFolderInDb,
  deleteFolder,
  deleteFolderFromDb,
  getFolders,
  getFoldersFromDb,
  updateFolder,
  updateFolderInDb,
} from "./folder";
export {
  createFile,
  getFileById,
  deleteFile,
  deleteFileFromDb,
  getFiles,
  getFilesFromDb,
  updateFile,
  updateFileInDb,
  type UpdateFileResult,
} from "./file";
export { getUserSubscription } from "./subscription";
export { subscribeEmailToNewsletter } from "./newsletter";
