"use client";

import Image from "next/image";

export default function Home() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden py-10">
            <div className="fixed inset-0 -z-10">
                <Image src="/wallpaper.png" alt="One Piece Wallpaper" fill className="object-cover blur-2xl" priority/>
            </div>
        </main>
    );
}
