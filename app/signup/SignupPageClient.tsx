'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signupSchema = z
    .object({
        email: z.string().trim().email('Please enter a valid email address.'),
        password: z.string().min(8, 'Password must be at least 8 characters.'),
        confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
    });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') ?? '/';

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
    });

    const onSubmit = handleSubmit(async (values) => {
        setServerError(null);

        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: values.email, password: values.password }),
            });

            if (!res.ok) {
                const data = (await res.json().catch(() => null)) as { message?: string } | null;
                setServerError(data?.message ?? 'Unable to create account.');
                return;
            }

            router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            router.refresh();
        } catch {
            setServerError('Unable to create account. Please try again.');
        }
    });

    return (
        <main className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
                    <p className="mt-1 text-sm text-gray-600">Create your account to continue.</p>
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
                        <label htmlFor="rhf-signup-email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="rhf-signup-email"
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
                        <label htmlFor="rhf-signup-password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="rhf-signup-password"
                            type="password"
                            autoComplete="new-password"
                            {...register('password')}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                            placeholder="••••••••"
                            aria-invalid={errors.password ? 'true' : 'false'}
                        />
                        {errors.password?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="rhf-signup-confirm" className="block text-sm font-medium text-gray-700">
                            Confirm password
                        </label>
                        <input
                            id="rhf-signup-confirm"
                            type="password"
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                            placeholder="••••••••"
                            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                        />
                        {errors.confirmPassword?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.confirmPassword.message}</p>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                        {isSubmitting ? 'Creating…' : 'Create account'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="text-gray-900 underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
