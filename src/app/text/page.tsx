'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TextChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rooms');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-surface p-4 text-center">
      <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-4" />
      <p className="text-white text-base font-bold">Entering 8-Member Custom Rooms...</p>
      <p className="text-xs text-gray-400 mt-1">Connecting you to group gaming, music &amp; hangout lounges!</p>
    </div>
  );
}
