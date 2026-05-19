import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Public sign-up is disabled — students arrive via /join with an invite.
  redirect('/join');
}
