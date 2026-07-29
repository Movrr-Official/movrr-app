"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BarChart3, Handshake, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell flex min-h-screen bg-movrr-bg-canvas">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="hidden flex-col justify-between bg-movrr-bg-primary p-12 text-movrr-text-inverse lg:flex lg:w-1/2"
      >
        <div>
          <div className="mb-8 flex items-center space-x-1">
            <div className="flex items-center justify-center p-1.5">
              <Image
                src="/movrr-icon-mark.png"
                alt="Movrr Icon"
                width={50}
                height={50}
                priority
                quality={100}
                aria-hidden="true"
              />
            </div>
            <span className="text-2xl font-bold uppercase">Movrr</span>
          </div>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
            MOVRR Business Workspace
          </h1>
          <p className="text-base opacity-90 md:text-lg">
            The secure workspace for organisations participating in the MOVRR
            platform — reward partners, advertisers, and future enterprise
            partners operating across fulfilment, campaigns, and account
            controls.
          </p>
        </div>

        <div className="mb-16 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-movrr-text-inverse/10">
              <Handshake
                className="size-5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            </div>
            <div>
              <h3 className="font-semibold">Reward Partner Operations</h3>
              <p className="opacity-80">
                Validate redemptions, confirm collections, manage staff access,
                and monitor fulfilment activity for your organisation.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-movrr-text-inverse/10">
              <BarChart3
                className="size-5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            </div>
            <div>
              <h3 className="font-semibold">Advertiser Insights</h3>
              <p className="opacity-80">
                Track campaign performance, rider engagement, analytics, billing
                posture, and organisation settings in one place.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-movrr-text-inverse/10">
              <ShieldCheck
                className="size-5"
                aria-hidden="true"
                strokeWidth={1.75}
              />
            </div>
            <div>
              <h3 className="font-semibold">
                Enterprise Security &amp; Role-Based Access
              </h3>
              <p className="opacity-80">
                After sign-in, access is scoped to your organisation membership
                and permissions — so each team only enters the workspace they
                are authorised to use.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 items-center justify-center bg-movrr-bg-soft p-8"
      >
        <div className="w-full max-w-md rounded-xl border border-movrr-border-soft bg-movrr-bg-surface text-movrr-text-heading shadow-none">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
