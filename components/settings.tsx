import { useAppState } from "@/hooks/use-app-state";
import { SignOut } from "./sign-out";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

export function Settings() {
  const { user } = useAppState();

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-lg font-semibold">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your profile and session.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Avatar>
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? "No email available"}
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm">Theme</span>
        <ThemeToggle />
      </div>

      <div className="flex justify-end">
        <SignOut size="sm" variant="outline" />
      </div>
    </div>
  );
}
