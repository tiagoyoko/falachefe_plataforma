import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userOnboarding } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const onboarding = await db
      .select({
        isCompleted: userOnboarding.isCompleted,
        completedAt: userOnboarding.completedAt,
      })
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, session.user.id))
      .limit(1);

    if (onboarding.length === 0) {
      return NextResponse.json({
        isCompleted: false,
      });
    }

    const userOnboardingData = onboarding[0];
    
    return NextResponse.json({
      isCompleted: userOnboardingData.isCompleted,
      completedAt: userOnboardingData.completedAt?.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao verificar status do onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
