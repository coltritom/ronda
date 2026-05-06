import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilPageClient } from "@/components/perfil/PerfilPageClient";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("groups(id, name, emoji)")
    .eq("user_id", user.id);

  const groups = (memberships ?? [])
    .map((m) => {
      const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
      if (!g) return null;
      const group = g as { id: string; name: string; emoji?: string };
      return {
        id: group.id,
        name: group.name,
        emoji: group.emoji ?? group.name.charAt(0).toUpperCase(),
      };
    })
    .filter((g): g is { id: string; name: string; emoji: string } => g !== null);

  const initialName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const initialAvatarEmoji = (user.user_metadata?.avatar_emoji as string | undefined) ?? "🙋‍♂️";

  return (
    <PerfilPageClient
      initialName={initialName}
      email={user.email ?? ""}
      initialAvatarEmoji={initialAvatarEmoji}
      initialGroups={groups}
    />
  );
}
