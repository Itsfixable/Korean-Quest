"use client";

import Image from "next/image";
import { asset } from "@/lib/asset";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGameStore } from "@/stores/useGameStore";
import "@/styles/pages/leaderboard.css";

interface LeaderboardRow {
  rank: number;
  name: string;
  badge: string;
  title: string;
  xp: number;
  isUser?: boolean;
  rankTheme?: "gold" | "silver" | "bronze" | "user" | "";
}

const columnHelper = createColumnHelper<LeaderboardRow>();

const columns = [
  columnHelper.accessor("rank", {
    header: "#",
    cell: (info) => info.getValue(),
    size: 56,
  }),
  columnHelper.accessor("name", {
    header: "Student",
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="lb-student-cell">
          <span className="lb-student-badge">{row.badge}</span>
          <span>{row.name}</span>
        </span>
      );
    },
    size: 220,
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => info.getValue(),
    size: 180,
  }),
  columnHelper.accessor("xp", {
    header: "XP",
    cell: (info) => info.getValue().toLocaleString(),
    size: 90,
  }),
];

export default function LeaderboardView() {
  const leaderboard = useGameStore((s) => s.leaderboard);
  const player = useGameStore((s) => s.player);
  const displayTitle = useGameStore((s) => s.getCurrentDisplayTitle());
  const displayEmoji = useGameStore((s) => s.getCurrentDisplayEmoji());
  const user = useAuthStore((s) => s.user);
  const displayName = user?.loggedIn ? user.name : "You";

  const data = useMemo(() => {
    const sorted = [
      ...leaderboard,
      {
        name: displayName,
        xp: player.totalXPEarned,
        title: displayTitle,
        badge: displayEmoji,
        streak: player.streak,
        isUser: true,
      },
    ].sort((a, b) => b.xp - a.xp);

    return sorted.map((row, index) => {
      let rankTheme: LeaderboardRow["rankTheme"] = "";
      if ("isUser" in row && row.isUser) rankTheme = "user";
      else if (index === 0) rankTheme = "gold";
      else if (index === 1) rankTheme = "silver";
      else if (index === 2) rankTheme = "bronze";

      return {
        rank: index + 1,
        name: row.name,
        badge: row.badge,
        title: row.title,
        xp: row.xp,
        isUser: "isUser" in row && row.isUser,
        rankTheme,
      };
    });
  }, [leaderboard, displayName, displayTitle, displayEmoji, player.totalXPEarned, player.streak]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="card lb-page-card">
      <div className="lb-header">
        <div className="lb-header-copy">
          <h1>Leaderboard</h1>
          <p className="muted">
            Weekly XP standings motivate consistency and friendly competition.
          </p>
        </div>
        <div className="lb-podium-wrap" aria-hidden="true">
          <Image
            src={asset("/favicon/leaderboard/podium.png")}
            alt=""
            width={300}
            height={130}
            className="lb-podium"
            priority
          />
        </div>
      </div>

      <div className="lb-table-wrap">
        <table className="lb-table" id="lbTable" aria-label="Leaderboard">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={header.column.id === "xp" ? "lb-col-xp" : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="kq-stagger">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  row.original.rankTheme === "gold" ? "kq-rank-1" : "",
                  row.original.rankTheme === "silver" ? "kq-rank-2" : "",
                  row.original.rankTheme === "bronze" ? "kq-rank-3" : "",
                  row.original.rankTheme === "user" ? "kq-you-row" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cell.column.id === "xp" ? "lb-col-xp" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
