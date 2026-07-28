"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

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
              <Image src="/movrr-icon.png" alt="Movrr Icon" width={50} height={50} priority quality={100} aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold uppercase">Movrr</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold">MOVRR Product Workspace</h1>
          <p className="text-xl opacity-90">Secure rider and advertiser access to campaign visibility, rewards, notifications, performance, and account settings across the MOVRR product family.</p>
        </div>

        <div className="mb-16 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-movrr-text-inverse/10">
              <span className="text-lg font-semibold">R</span>
            </div>
            <div>
              <h3 className="font-semibold">Rider Visibility</h3>
              <p className="opacity-80">Review assigned campaigns, rewards, route posture, and product notifications from the web.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-movrr-text-inverse/10">
              <span className="text-lg font-semibold">A</span>
            </div>
            <div>
              <h3 className="font-semibold">Advertiser Insight</h3>
              <p className="opacity-80">Monitor campaign visibility, rider participation, analytics, billing posture, and account settings.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-movrr-text-inverse/10">
              <span className="text-lg font-semibold">S</span>
            </div>
            <div>
              <h3 className="font-semibold">Security-Scoped Sessions</h3>
              <p className="opacity-80">Authentication and role-based routing ensure riders and advertisers only enter their intended product surface.</p>
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
        <div className="w-full max-w-md rounded-xl border border-movrr-border-soft bg-movrr-bg-surface text-movrr-text-heading shadow-sm">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
