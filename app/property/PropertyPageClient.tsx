'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Property = {
    id: number;
    slug: string;
    title: string;
    location: string;
    type: 'retail' | 'office' | 'hotel' | 'residential' | string;
    imageUrl: string;
    priceThb: number | null;
    isFavorite: boolean;
};

export default function PropertyPageClient() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const favoritesCount = useMemo(() => properties.filter((p) => p.isFavorite).length, [properties]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setError(null);
            setIsLoading(true);
            try {
                const res = await fetch('/api/properties', { cache: 'no-store' });

                if (res.status === 404) {
                    if (!cancelled) {
                        setProperties([]);
                        setError('404 not found property');
                    }
                    return;
                }

                if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as { message?: string } | null;
                    throw new Error(data?.message ?? 'Unable to load properties.');
                }

                const data = (await res.json()) as { ok: boolean; properties: Property[] };
                if (!cancelled) setProperties(data.properties ?? []);
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load properties.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [router]);

    async function toggleFavorite(propertyId: number, nextFavorite: boolean) {
        setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, isFavorite: nextFavorite } : p)));

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, favorite: nextFavorite }),
            });

       
            if (!res.ok) {
                throw new Error('Unable to update favorite.');
            }
        } catch {
            setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, isFavorite: !nextFavorite } : p)));
        }
    }

    async function onLogout() {
        setIsLoggingOut(true);
        try {
            await fetch('/api/logout', { method: 'POST' });
        } finally {
            router.replace('/login');
            router.refresh();
        }
    }

    return (
        <main className="min-h-screen bg-white px-4 py-10">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image src="/cpn-45-logo.svg" alt="Central Pattana Image" width={160} height={60} />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
                            <p className="mt-1 text-sm text-gray-600">Favorites: {favoritesCount}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void onLogout()}
                        disabled={isLoggingOut}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                    >
                        {isLoggingOut ? 'Logging out…' : 'Logout'}
                    </button>
                </div>

                {error ? (
                    <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <p className="text-sm text-gray-600">Loading…</p>
                ) : (
                    <ul className="space-y-3">
                        {properties.map((p) => (
                            <li key={p.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="relative h-14 w-14 overflow-hidden rounded-md border border-gray-200 bg-white">
                                            <Image src={p.imageUrl} alt={p.title} fill className="object-contain p-2" />
                                        </div>

                                        <div>
                                        <h2 className="text-base font-semibold text-gray-900">{p.title}</h2>
                                        <p className="mt-1 text-sm text-gray-600">{p.location}</p>
                                        <p className="mt-1 text-sm text-gray-600">Type: {p.type}</p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {p.priceThb ? `฿${p.priceThb.toLocaleString()}` : '—'}
                                        </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void toggleFavorite(p.id, !p.isFavorite)}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                        aria-pressed={p.isFavorite}
                                    >
                                        {p.isFavorite ? 'Unfavorite' : 'Favorite'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
