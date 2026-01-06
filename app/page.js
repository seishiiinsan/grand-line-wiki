"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
    const [arcs, setArcs] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const arcsResponse = await fetch("https://api.api-onepiece.com/v2/arcs/fr");
            const fruitsResponse = await fetch("https://api.api-onepiece.com/v2/fruits/fr");
            const charactersResponse = await fetch("https://api.api-onepiece.com/v2/characters/fr");

            const arcsData = await arcsResponse.json();
            const fruitsData = await fruitsResponse.json();
            const charactersData = await charactersResponse.json();

            setArcs(arcsData);
            setFruits(fruitsData);
            setCharacters(charactersData);
        }

        fetchData();
    }, []);

    console.log(arcs, fruits, characters);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
            <div className="fixed inset-0 -z-10">
                <Image src="/wallpaper.png" alt="One Piece Wallpaper" fill className="object-cover blur-2xl" priority/>
            </div>
        </main>
    );
}
