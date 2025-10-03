import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { getFullUser, FullUser } from "@/lib/auth-utils";

export function useFullUser() {
  const { data: session, isPending } = useSession();
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFullUser() {
      if (!session?.user) {
        setFullUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const user = await getFullUser(session.user);
        setFullUser(user);
      } catch (error) {
        console.error('Error fetching full user:', error);
        setFullUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFullUser();
  }, [session?.user]);

  return {
    user: fullUser,
    session,
    isPending: isPending || isLoading,
    isAuthenticated: !!fullUser,
  };
}
