import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndPersistPlayerElo } from "@/lib/player-elo";

function buildFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourcePlayerId } = await context.params;
    const body = await request.json().catch(() => null);
    const targetPlayerId = String(body?.targetPlayerId ?? "").trim();

    if (!targetPlayerId) {
      return NextResponse.json(
        { error: "Select the player you want to keep before merging." },
        { status: 400 }
      );
    }

    if (sourcePlayerId === targetPlayerId) {
      return NextResponse.json(
        { error: "Choose a different player as the merge target." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const [sourcePlayer, targetPlayer] = await Promise.all([
        tx.player.findUnique({
          where: { id: sourcePlayerId },
          select: {
            id: true,
            userId: true,
            firstName: true,
            middleInitial: true,
            lastName: true,
          },
        }),
        tx.player.findUnique({
          where: { id: targetPlayerId },
          select: {
            id: true,
            userId: true,
            firstName: true,
            middleInitial: true,
            lastName: true,
          },
        }),
      ]);

      if (!sourcePlayer) {
        throw new Error("Source player not found.");
      }

      if (!targetPlayer) {
        throw new Error("Target player not found.");
      }

      if (sourcePlayer.userId && targetPlayer.userId) {
        throw new Error(
          "Both players already have linked user accounts. Reassign or remove one linked account before merging."
        );
      }

      const sourceEntryMembers = await tx.tournamentEntryMember.findMany({
        where: {
          playerId: sourcePlayerId,
        },
        select: {
          id: true,
          tournamentEntryId: true,
        },
      });

      const targetEntryMembers = await tx.tournamentEntryMember.findMany({
        where: {
          playerId: targetPlayerId,
          tournamentEntryId: {
            in: sourceEntryMembers.map((entryMember) => entryMember.tournamentEntryId),
          },
        },
        select: {
          tournamentEntryId: true,
        },
      });

      const targetEntryIds = new Set(
        targetEntryMembers.map((entryMember) => entryMember.tournamentEntryId)
      );

      if (sourcePlayer.userId && !targetPlayer.userId) {
        await tx.player.update({
          where: { id: sourcePlayerId },
          data: { userId: null },
        });

        await tx.player.update({
          where: { id: targetPlayerId },
          data: { userId: sourcePlayer.userId },
        });
      }

      await tx.invitation.updateMany({
        where: {
          playerId: sourcePlayerId,
        },
        data: {
          playerId: targetPlayerId,
        },
      });

      await tx.playerBreak.updateMany({
        where: {
          playerId: sourcePlayerId,
        },
        data: {
          playerId: targetPlayerId,
        },
      });

      for (const entryMember of sourceEntryMembers) {
        if (targetEntryIds.has(entryMember.tournamentEntryId)) {
          await tx.tournamentEntryMember.delete({
            where: {
              id: entryMember.id,
            },
          });
          continue;
        }

        await tx.tournamentEntryMember.update({
          where: {
            id: entryMember.id,
          },
          data: {
            playerId: targetPlayerId,
          },
        });
      }

      await tx.player.delete({
        where: { id: sourcePlayerId },
      });

      return {
        targetPlayerId,
        targetPlayerName: buildFullName(
          targetPlayer.firstName,
          targetPlayer.middleInitial,
          targetPlayer.lastName
        ),
      };
    });

    try {
      await recalculateAndPersistPlayerElo(prisma);
    } catch (error) {
      console.error("POST /api/admin/players/[id]/merge elo recalculation error:", error);

      return NextResponse.json(
        {
          error:
            "The duplicate player was merged successfully, but Elo recalculation failed afterward. Run the Elo sync again before relying on updated rankings.",
          targetPlayerId: result.targetPlayerId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Merged duplicate player into ${result.targetPlayerName}.`,
      targetPlayerId: result.targetPlayerId,
    });
  } catch (error) {
    console.error("POST /api/admin/players/[id]/merge error:", error);

    const message = error instanceof Error ? error.message : "Failed to merge player.";
    const status =
      message === "Source player not found." || message === "Target player not found."
        ? 404
        : message.includes("linked user accounts")
          ? 409
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}