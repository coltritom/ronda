"use client";

import { PersonalSummary } from "@/components/home/PersonalSummary";
import { PendingDebts } from "@/components/home/PendingDebts";
import { UpcomingJuntadas } from "@/components/home/UpcomingJuntadas";
import { RecentActivity } from "@/components/home/RecentActivity";
import { MyGroups } from "@/components/home/MyGroups";
import { MyBadges } from "@/components/home/MyBadges";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto pb-8">
      <PersonalSummary />
      <PendingDebts />
      <UpcomingJuntadas />
      <RecentActivity />
      <MyGroups />
      <MyBadges />
    </div>
  );
}
