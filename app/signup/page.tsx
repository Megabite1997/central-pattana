import { Suspense } from 'react';

import SignupPageClient from './SignupPageClient';

export default function Page() {
	return (
		<Suspense fallback={null}>
			<SignupPageClient />
		</Suspense>
	);
}
