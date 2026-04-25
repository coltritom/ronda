"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/clients";
import { fmtARS } from "@/lib/utils";

interface Stats {
  name: string;
  debes: number;
  teDebon: number;
  attended: number;
  totalEvents: number;
}

export function PersonalSummary() {
  const [avatarEmoji, setAvatarEmoji] = useState("🙋‍♂️");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ronda_avatar");
    if (saved) setAvatarEmoji(saved);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: mySplitsRaw }, { data: memberData }] =
        await Promise.all([
          supabase.from("profiles").select("name").eq("id", user.id).single(),
          supabase
            .from("expense_splits")
            .select("expense_id, amount")
            .eq("user_id", user.id),
          supabase
            .from("group_members")
            .select("group_id")
            .eq("user_id", user.id),
        ]);

      // If the profile name looks like an email (trigger mis-wired), fall back
      // to auth metadata and silently repair the profile row.
      const profileName = profile?.name ?? "";
      const isEmailInName = profileName.includes("@");
      const metaName: string =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      const resolvedName = isEmailInName ? metaName : profileName;
      if (isEmailInName && metaName) {
        supabase.from("profiles").update({ name: metaName }).eq("id", user.id);
      }

      const mySplits = mySplitsRaw ?? [];
      const groupIds = (memberData ?? []).map((m) => m.group_id);

      let debes = 0;
      let teDebon = 0;

      if (mySplits.length > 0) {
        const myExpenseIds = mySplits.map((s) => s.expense_id);

        const { data: expData } = await supabase
          .from("expenses")
          .select("id, paid_by")
          .in("id", myExpenseIds);

        const paidByMeIds = new Set(
          (expData ?? []).filter((e) => e.paid_by === user.id).map((e) => e.id)
        );
        const paidByOtherIds = new Set(
          (expData ?? []).filter((e) => e.paid_by !== user.id).map((e) => e.id)
        );

        const grossDebes = mySplits
          .filter((s) => paidByOtherIds.has(s.expense_id))
          .reduce((sum, s) => sum + s.amount, 0);

        const paidByMeArray = [...paidByMeIds];

        const [{ data: settledOut }, { data: settledIn }, othersSplitsResult] =
          await Promise.all([
            supabase
              .from("settlements")
              .select("amount")
              .eq("from_user", user.id),
            supabase
              .from("settlements")
              .select("amount")
              .eq("to_user", user.id),
            paidByMeArray.length > 0
              ? supabase
                  .from("expense_splits")
                  .select("amount")
                  .in("expense_id", paidByMeArray)
                  .neq("user_id", user.id)
              : Promise.resolve({ data: [] }),
          ]);

        const totalSettledOut = (settledOut ?? []).reduce(
          (s, r) => s + r.amount,
          0
        );
        const totalSettledIn = (settledIn ?? []).reduce(
          (s, r) => s + r.amount,
          0
        );
        const grossTeDebon = (othersSplitsResult.data ?? []).reduce(
          (s, r) => s + r.amount,
          0
        );

        debes = Math.max(0, grossDebes - totalSettledOut);
        teDebon = Math.max(0, grossTeDebon - totalSettledIn);
      }

      let attended = 0;
      let totalEvents = 0;

      if (groupIds.length > 0) {
        const now = new Date().toISOString();
        const { data: lastTen } = await supabase
          .from("events")
          .select("id")
          .in("group_id", groupIds)
          .neq("status", "cancelled")
          .lte("date", now)
          .order("date", { ascending: false })
          .limit(10);
        const lastTenIds = (lastTen ?? []).map((e) => e.id);
        totalEvents = lastTenIds.length;
        if (lastTenIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from("event_attendance")
            .select("event_id")
            .eq("user_id", user.id)
            .in("event_id", lastTenIds);
          attended = (attendanceData ?? []).length;
        }
      }

      setStats({
        name: resolvedName.split(" ")[0] || "Vos",
        debes,
        teDebon,
        attended,
        totalEvents,
      });
    }

    load();
  }, []);

  const statCards = [
    {
      value: stats ? `$${fmtARS(stats.debes)}` : "—",
      label: "Debés",
      sub: "saldo actual",
      href: "/home/debes",
    },
    {
      value: stats ? `$${fmtARS(stats.teDebon)}` : "—",
      label: "Te deben",
      sub: "saldo actual",
      href: "/home/te-deben",
    },
    {
      value: stats ? `${stats.attended}/${stats.totalEvents}` : "—",
      label: "Asistencia",
      sub: "últimas 10 juntadas",
      href: "/home/asistencia",
    },
  ];

  return (
    <div className="px-4 md:px-6 pt-5 pb-1">
      <div className="flex justify-center mb-5">
        <Image
          src="/ronda-wordmark.png"
          alt="Ronda"
          width={80}
          height={80}
          className="opacity-40"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-[22px] text-carbon dark:text-humo m-0">
            Hola, {stats?.name ?? "..."}
          </h1>
          <p className="text-[13px] text-gris-cal dark:text-niebla mt-0.5">
            Tu resumen
          </p>
        </div>
        <Link href="/perfil" className="rounded-full">
          <Avatar
            emoji={avatarEmoji}
            name={stats?.name ?? ""}
            colorIndex={1}
            size="md"
            selected
          />
        </Link>
      </div>

      <div className="flex gap-2 mb-3">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px] py-3 px-3.5 text-center hover:opacity-75 active:scale-95 transition-all"
          >
            <p className="font-display font-bold text-xl text-carbon dark:text-humo m-0">
              {s.value}
            </p>
            <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">
              {s.label}
            </p>
            <p className="text-[10px] text-gris-cal/60 dark:text-niebla/60 mt-0.5">
              {s.sub}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
