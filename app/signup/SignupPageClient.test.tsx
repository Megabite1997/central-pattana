import { render, screen } from '@testing-library/react';
import SignupPageClient from './SignupPageClient';

jest.mock('next/image', () => ({
    __esModule: true,
    default: function MockNextImage(props: any) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img alt={props.alt} src={props.src} />;
    },
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: function MockNextLink({ href, children, ...rest }: any) {
        return (
            <a href={href} {...rest}>
                {children}
            </a>
        );
    },
}));

jest.mock('next/navigation', () => ({
    __esModule: true,
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
}));

describe('SignupPageClient', () => {
    it('renders the signup form', () => {
        render(<SignupPageClient />);

        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
    });
});
