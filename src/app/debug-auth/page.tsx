import { DebugAuth } from "@/components/auth/debug-auth";

export default function DebugAuthPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Debug de Autenticação
        </h1>
        <DebugAuth />
      </div>
    </main>
  );
}
