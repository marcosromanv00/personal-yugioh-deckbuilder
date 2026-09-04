'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const GlobalAIChatDrawer = dynamic(
  () => import('@/components/chat/GlobalAIChatDrawer').then((m) => m.GlobalAIChatDrawer),
  { ssr: false }
);

const IdealSyncLoaderModal = dynamic(
  () => import('@/components/collection/IdealSyncLoaderModal').then((m) => m.IdealSyncLoaderModal),
  { ssr: false }
);

const IdealReportModal = dynamic(
  () => import('@/components/collection/IdealReportModal').then((m) => m.IdealReportModal),
  { ssr: false }
);

const PhysicalStagingAssistantModal = dynamic(
  () => import('@/components/collection/PhysicalStagingAssistantModal').then((m) => m.PhysicalStagingAssistantModal),
  { ssr: false }
);

/**
 * GlobalModals
 * Client component container that lazily code-splits heavy application-wide modals
 * without bloating Server Components or the initial HTML payload.
 */
export function GlobalModals() {
  return (
    <>
      <GlobalAIChatDrawer />
      <IdealSyncLoaderModal />
      <IdealReportModal />
      <PhysicalStagingAssistantModal />
    </>
  );
}
