import OtpForm from '../components/auth/OtpForm';

export default function Register() {
  return (
    <div className="max-w-screen-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">Create an account</h1>
      <OtpForm purpose="REGISTER" />
    </div>
  );
}
