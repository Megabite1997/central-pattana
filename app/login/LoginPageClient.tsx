'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().trim().email('Please enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    remember: z.boolean().default(true),
});

type LoginFormValues = z.input<typeof loginSchema>;

export default function LoginPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') ?? '/';

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', remember: true },
    });

    const onSubmit = handleSubmit(async (values) => {
        setServerError(null);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const data = (await res.json().catch(() => null)) as { message?: string } | null;
                setServerError(data?.message ?? 'Invalid email or password.');
                return;
            }

            router.replace(callbackUrl);
            router.refresh();
        } catch {
            setServerError('Unable to sign in. Please try again.');
        }
    });

    return (
        <main className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
                    <p className="mt-1 text-sm text-gray-600">Use your account credentials to continue.</p>
                </div>

                {serverError ? (
                    <div
                        role="alert"
                        className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                        {serverError}
                    </div>
                ) : null}

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="rhf-email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="rhf-email"
                            type="email"
                            autoComplete="email"
                            {...register('email')}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                            placeholder="you@example.com"
                            aria-invalid={errors.email ? 'true' : 'false'}
                        />
                        {errors.email?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="rhf-password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="rhf-password"
                            type="password"
                            autoComplete="current-password"
                            {...register('password')}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                            placeholder="••••••••"
                            aria-invalid={errors.password ? 'true' : 'false'}
                        />
                        {errors.password?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>
                        ) : null}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                {...register('remember')}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Remember me
                        </label>

                        <Link href="/forgot-password" className="text-sm text-gray-900 underline">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-gray-900 underline">
                        Create one
                    </Link>
                </p>

                <p className="mt-2 text-xs text-gray-500">
                    Redirect after sign-in: <span className="font-mono text-gray-700">{callbackUrl}</span>
                </p>
            </div>
        </main>
    );
}
