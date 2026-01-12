"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [sources, setSources] = useState({ arcs: [], fruits: [], characters: [] });
    const [results, setResults] = useState({ arcs: [], fruits: [], characters: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const [dropdownStyle, setDropdownStyle] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setLoading(true);
                const [arcsRes, fruitsRes, charsRes] = await Promise.all([
                    fetch("https://api.api-onepiece.com/v2/arcs/fr"),
                    fetch("https://api.api-onepiece.com/v2/fruits/fr"),
                    fetch("https://api.api-onepiece.com/v2/characters/fr"),
                ]);

                if (!arcsRes.ok || !fruitsRes.ok || !charsRes.ok) {
                    const msg = "Erreur lors de la récupération des données de l'API";
                    setError(msg);
                    return;
                }

                const [arcsData, fruitsData, charsData] = await Promise.all([
                    arcsRes.json(),
                    fruitsRes.json(),
                    charsRes.json(),
                ]);

                if (!mounted) return;
                setSources({ arcs: arcsData, fruits: fruitsData, characters: charsData });
                setError(null);
            } catch (e) {
                console.error(e);
                if (!mounted) return;
                setError(e.message || "Erreur inconnue");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(id);
    }, [query]);

    function getItemLabel(item) {
        if (!item) return "";
        return (
            item.title ||
            item.name ||
            item.label ||
            item.displayName ||
            item.slug ||
            item.fr?.name ||
            item.fr?.title ||
            (typeof item === "string" ? item : JSON.stringify(item).slice(0, 120))
        );
    }

    // helper to find a probable image url from various API shapes
    function getItemImage(item) {
        if (!item) return null;
        // common fields used by various APIs
        const candidates = [
            item.image,
            item.picture,
            item.thumbnail,
            item.thumb,
            item.img,
            item.url,
            item.image_url,
            item.picture_url,
        ];
        for (const c of candidates) {
            if (typeof c === 'string' && c.trim()) return c;
        }
        // nested french object
        if (item.fr?.image) return item.fr.image;
        if (Array.isArray(item.images) && item.images.length) return item.images[0];
        return null;
    }

    useEffect(() => {
        if (!debounced) {
            setResults({ arcs: [], fruits: [], characters: [] });
            setOpen(false);
            return;
        }

        const q = debounced.toLowerCase();
        const match = (item) => getItemLabel(item).toLowerCase().includes(q);

        setResults({
            arcs: Array.isArray(sources.arcs) ? sources.arcs.filter(match) : [],
            fruits: Array.isArray(sources.fruits) ? sources.fruits.filter(match) : [],
            characters: Array.isArray(sources.characters) ? sources.characters.filter(match) : [],
        });

        setOpen(true);
    }, [debounced, sources]);

    // keyboard shortcuts
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setOpen(true);
            }
            if (e.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // outside click close
    useEffect(() => {
        function onDoc(e) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
    }, []);

    // position the detached dropdown under the input using a portal
    useEffect(() => {
        function update() {
            const el = inputRef.current;
            if (!el) return setDropdownStyle(null);
            const rect = el.getBoundingClientRect();
            let left = rect.left + window.scrollX;
            let width = rect.width;
            const margin = 12;
            // ensure dropdown doesn't overflow the viewport
            if (left + width > window.scrollX + window.innerWidth - margin) {
                left = window.scrollX + window.innerWidth - width - margin;
                if (left < margin) {
                    // shrink width if too large
                    width = Math.min(width, window.innerWidth - margin * 2);
                    left = margin + window.scrollX;
                }
            }
            setDropdownStyle({
                left,
                top: rect.bottom + window.scrollY + 8,
                width,
            });
        }

        if (open) {
            update();
            window.addEventListener('resize', update);
            window.addEventListener('scroll', update, true);
        }

        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [open, query]);

    function clear() {
        setQuery("");
        setDebounced("");
        setResults({ arcs: [], fruits: [], characters: [] });
        setOpen(false);
    }

    const total = (results.arcs?.length || 0) + (results.fruits?.length || 0) + (results.characters?.length || 0);

    // render
    return (
        <>
            <nav className="fixed sm:top-4 top-0 left-0 right-0 z-50 pointer-events-auto">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg p-3 sm:p-4">
                        {/* Brand */}
                        <div className="flex items-center gap-3 min-w-35">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                                GL
                            </div>
                            <div className="flex flex-col">
                                <Link href="/" className="text-sm sm:text-lg font-semibold text-gray-900 leading-tight">Grand Line Wiki</Link>
                                <div className="text-xs text-gray-500">Arcs • Fruits • Personnages</div>
                            </div>
                        </div>

                        {/* Search (center) */}
                        <div className="flex-1 relative" ref={containerRef}>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>

                                <input
                                    id="search-input"
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onFocus={() => debounced && setOpen(true)}
                                    placeholder="Recherche rapide — arcs, fruits, personnages..."
                                    aria-label="Barre de recherche"
                                    aria-autocomplete="list"
                                    aria-controls="search-results"
                                    aria-expanded={open}
                                    role="combobox"
                                    className="w-full h-11 text-sm pl-12 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition shadow-sm"
                                />

                                {query ? (
                                    <button onClick={clear} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 px-2 py-1">
                                        ×
                                    </button>
                                ) : (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">⌘K</div>
                                )}
                            </div>

                            {/* old inline dropdown removed - now rendered detached via portal below */}
                        </div>

                        {/* Placeholder right actions */}
                        <div className="flex items-center gap-3 min-w-20 justify-end">
                            <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">Aide</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Detached dropdown rendered in a portal so it visually floats under the input */}
            {open && dropdownStyle && typeof document !== 'undefined' && createPortal(
                <div style={{ left: dropdownStyle.left + 'px', top: dropdownStyle.top + 'px', width: dropdownStyle.width + 'px' }} className="fixed z-50">
                    <div className="rounded-xl bg-white shadow-2xl border border-gray-100 p-3 w-full">
                        {loading && <div className="text-sm text-gray-500">Chargement...</div>}
                        {error && <div className="text-sm text-red-600">{error}</div>}

                        {!loading && !error && (
                            <div className="space-y-3">
                                <div className="text-xs text-gray-500">Résultats pour « {debounced} » — {total} trouvés</div>

                                {results.arcs?.length > 0 && (
                                    <section aria-label="Arcs" className="rounded-md overflow-hidden">
                                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 border-l-4 border-indigo-400">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span className="text-sm font-semibold text-indigo-700">Arcs</span>
                                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{results.arcs.length}</span>
                                        </div>
                                        <ul className="divide-y mt-1">
                                            {results.arcs.slice(0, 2).map((a, i) => (
                                                <li key={a.id || a._id || i} className="px-3 py-2 hover:bg-indigo-50 transition flex items-center gap-3">
                                                    {/* Affiche une image si disponible, sinon un emoji représentant un arc/carte */}
                                                    {getItemImage(a) ? (
                                                        <Image src={getItemImage(a)} alt={getItemLabel(a)} width={36} height={36} className="rounded object-cover shrink-0 w-9 h-9" />
                                                    ) : (
                                                        <div className="shrink-0 w-9 h-9 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 text-lg">🗺️</div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <Link href="#" title={getItemLabel(a)} className="text-sm text-indigo-900 block truncate overflow-hidden whitespace-nowrap">{getItemLabel(a)}</Link>
                                                        {/* Affiche un petit résumé si l'API en fournit un */}
                                                        {(a.summary || a.description || a.fr?.description) && (
                                                            <div className="text-xs text-gray-500 truncate">{a.summary || a.description || a.fr?.description}</div>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {results.fruits?.length > 0 && (
                                    <section aria-label="Fruits" className="rounded-md overflow-hidden">
                                        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 border-l-4 border-yellow-400">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                <path d="M12 2c2 2 4 2 6 1 0 3-2 6-6 9-4-3-6-6-6-9 2 1 4 1 6-1z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-sm font-semibold text-yellow-800">Fruits</span>
                                            <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{results.fruits.length}</span>
                                        </div>
                                        <ul className="divide-y mt-1">
                                            {results.fruits.slice(0, 2).map((f, i) => (
                                                <li key={f.id || f._id || i} className="px-3 py-2 hover:bg-yellow-50 transition flex items-center gap-3">
                                                    {getItemImage(f) ? (
                                                        <Image src={getItemImage(f)} alt={getItemLabel(f)} width={36} height={36} className="rounded object-cover shrink-0 w-9 h-9" />
                                                    ) : (
                                                        <div className="shrink-0 w-9 h-9 rounded bg-yellow-100 flex items-center justify-center text-yellow-700 text-lg">🍏</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <Link href="#" title={getItemLabel(f)} className="text-sm text-yellow-900 block truncate overflow-hidden whitespace-nowrap">{getItemLabel(f)}</Link>
                                                        {f.type && <div className="text-xs text-gray-500 truncate">{f.type}</div>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {results.characters?.length > 0 && (
                                    <section aria-label="Personnages" className="rounded-md overflow-hidden">
                                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 border-l-4 border-emerald-400">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                                <path d="M12 12c2.7 0 4.5-1.8 4.5-4.5S14.7 3 12 3 7.5 4.8 7.5 7.5 9.3 12 12 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-sm font-semibold text-emerald-700">Personnages</span>
                                            <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{results.characters.length}</span>
                                        </div>
                                        <ul className="divide-y mt-1">
                                            {results.characters.slice(0, 2).map((c, i) => (
                                                <li key={c.id || c._id || i} className="px-3 py-2 hover:bg-emerald-50 transition flex items-center gap-3">
                                                    {getItemImage(c) ? (
                                                        <Image src={getItemImage(c)} alt={getItemLabel(c)} width={36} height={36} className="rounded object-cover shrink-0 w-9 h-9" />
                                                    ) : (
                                                        <div className="shrink-0 w-9 h-9 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg">👤</div>
                                                    )}
                                                    <div className="flex-1 min-w-0 flex flex-col">
                                                        <Link href="#" title={getItemLabel(c)} className="text-sm text-emerald-900 block truncate overflow-hidden whitespace-nowrap">{getItemLabel(c)}</Link>
                                                        {c.role && <div className="text-xs text-gray-500 truncate">{c.role}</div>}
                                                        {c.species && <div className="text-xs text-gray-500 truncate">{c.species}</div>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

