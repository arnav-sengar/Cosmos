export interface AccountDropdownUser {
  displayName: string;
  avatarUrl?: string | null;
}

export interface AccountDropdownProps {
  user: AccountDropdownUser;
  onSignOut: () => void | Promise<void>;
}
