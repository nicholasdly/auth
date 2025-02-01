export const VerificationEmailTemplate = ({ code }: { code: string }) => (
  <main>
    <p className="text-2xl">
      Your verification code is: <span className="font-semibold">{code}</span>
    </p>
  </main>
);
