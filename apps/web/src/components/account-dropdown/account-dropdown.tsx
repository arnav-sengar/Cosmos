"use client";

import { useState } from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@cosmos/ui";

import type { AccountDropdownProps } from "./account-dropdown.types";

import styles from "./account-dropdown.module.css";

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AccountAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const initials = getInitials(displayName);

  return (
    <span className={styles.avatar} aria-hidden="true">
      {avatarUrl && failedAvatarUrl !== avatarUrl ? (
        <Image
          className={styles.avatarImage}
          src={avatarUrl}
          alt=""
          width={40}
          height={40}
          unoptimized
          onError={() => setFailedAvatarUrl(avatarUrl)}
        />
      ) : (
        <span className={styles.avatarFallback}>{initials}</span>
      )}
    </span>
  );
}

export function AccountDropdown({
  user,
  onSignOut,
}: AccountDropdownProps) {
  const displayName = user.displayName.trim() || "User";

  return (
    <DropdownMenu placement="bottom-end">
      <DropdownMenuTrigger>
        <button
          type="button"
          className={styles.trigger}
          aria-label={`Account menu for ${displayName}`}
        >
          <AccountAvatar
            displayName={displayName}
            avatarUrl={user.avatarUrl}
          />

          <span className={styles.displayName}>{displayName}</span>

          <span className={styles.chevron} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent aria-label="Account menu">
        <DropdownMenuLinkItem href="/profile">
          Profile
        </DropdownMenuLinkItem>

        <DropdownMenuLinkItem href="/settings">
          Settings
        </DropdownMenuLinkItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={onSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
