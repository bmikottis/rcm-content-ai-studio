"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { cn } from "@/lib/cn";

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuthStore();
  const { loadContext } = useContextStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    
    loadContext();
    await login();
    
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={closeLoginModal}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-[380px] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card */}
            <div className="relative overflow-hidden rounded bg-[var(--surface)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
              
              {/* Close button */}
              <button
                onClick={closeLoginModal}
                className="absolute top-3 right-3 p-2 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative px-6 pt-6 pb-6">
                {/* Salesforce icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded bg-[#0F8EFF] flex items-center justify-center">
                    <SalesforceCloudIcon className="w-7 h-5 text-white" />
                  </div>
                </div>
                
                {/* Title */}
                <h2 className="text-heading-medium text-[var(--text-primary)] mb-2">
                  Connect to Salesforce
                </h2>
                
                {/* Subtext */}
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-6">
                  Access your brand, assets and campaigns
                </p>

                {/* Button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={cn(
                    "w-full h-10 rounded text-[13px]",
                    "bg-[#0F8EFF] text-white",
                    "flex items-center justify-center gap-2",
                    "transition-colors",
                    "hover:bg-[#014486]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <SalesforceCloudIcon className="w-5 h-4" />
                      <span>Continue with Salesforce</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
                <p className="text-[13px] text-[var(--text-muted)] text-center">
                  Your data stays secure with Salesforce authentication
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 4L4 12M4 4l8 8" />
    </svg>
  );
}

function SalesforceCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.2 6.4c1.9-2 4.5-3.2 7.4-3.2 4.1 0 7.7 2.4 9.3 5.9 1.3-.6 2.7-.9 4.2-.9 5.5 0 10 4.5 10 10s-4.5 10-10 10H8.5C3.8 28.2 0 24.4 0 19.7c0-4.1 2.9-7.5 6.8-8.3.3-2.9 2.7-5.2 5.7-5.2 1.3 0 2.5.4 3.5 1.1.9-.3 1.9-.5 2.9-.5.5 0 .9 0 1.3.1v-.5z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
