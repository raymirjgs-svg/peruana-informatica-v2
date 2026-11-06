'use client';

import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('sileo').then(mod => ({ default: mod.Toaster })), { ssr: false });

export default function SileoToaster() {
    return <Toaster position="top-right" />;
}
