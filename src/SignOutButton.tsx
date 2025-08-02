"use client";
import apiService from "./services/api";

interface SignOutButtonProps {
  onSignOut?: () => void;
}

export function SignOutButton({ onSignOut }: SignOutButtonProps) {
  const handleSignOut = () => {
    apiService.logout();
    if (onSignOut) {
      onSignOut();
    } else {
      window.location.reload();0
    }
  };

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      تسجيل الخروج
    </button>
  );
}
