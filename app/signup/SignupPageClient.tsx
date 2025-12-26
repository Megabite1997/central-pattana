'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signupSchema = z
    .object({
        email: z.email('Please enter a valid email address.'),
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

    const [serverError, setServerError] = useState<string | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const successCtaRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!isSuccessModalOpen) return;
        successCtaRef.current?.focus();
    }, [isSuccessModalOpen]);

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
        setIsSuccessModalOpen(false);

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

            setIsSuccessModalOpen(true);
        } catch {
            setServerError('Unable to create account. Please try again.');
        }
    });

    return (
        <main className="min-h-screen flex flex-col gap-4 items-center justify-center bg-white px-4">
            {isSuccessModalOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    role="dialog"
             
                >
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Account created
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">Your account was created successfully.</p>
                        <div className="mt-6">
                            <button
                                ref={successCtaRef}
                                type="button"
                                onClick={() => router.push('/property')}
                                className="w-full rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white cursor-pointer"
                            >
                                Go to properties
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <Image src="/cpn-45-logo.svg" alt="Central Pattana Image" width={400} height={300} />
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
                        <div className="relative mt-1">
                            <input
                                id="rhf-signup-password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete="new-password"
                                {...register('password')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 text-sm outline-none focus:border-gray-900"
                                placeholder="••••••••"
                                aria-invalid={errors.password ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible((v) => !v)}
                                aria-pressed={isPasswordVisible}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 underline cursor-pointer"
                            >
                                {isPasswordVisible ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>
                        ) : null}
                    </div>

                    <div>
                        <label htmlFor="rhf-signup-confirm" className="block text-sm font-medium text-gray-700">
                            Confirm password
                        </label>
                        <div className="relative mt-1">
                            <input
                                id="rhf-signup-confirm"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                autoComplete="new-password"
                                {...register('confirmPassword')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 text-sm outline-none focus:border-gray-900"
                                placeholder="••••••••"
                                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                            />
                            <button
                                type="button"
                                onClick={() => setIsConfirmPasswordVisible((v) => !v)}
                                aria-pressed={isConfirmPasswordVisible}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 underline cursor-pointer"
                            >
                                {isConfirmPasswordVisible ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.confirmPassword?.message ? (
                            <p className="mt-1 text-xs text-red-700">{errors.confirmPassword.message}</p>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-md bg-brand-gold px-3 py-2 text-sm font-medium text-white disabled:opacity-60 cursor-pointer"
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
