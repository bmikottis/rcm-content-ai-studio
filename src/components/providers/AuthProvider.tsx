"use client";

import { ReactNode } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <>
      {children}
      <LoginModal />
    </>
  );
}
