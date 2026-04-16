import { Button } from "@/components/ui/Button";

interface EmptyGroupStateProps {
  memberCount: number;
  onCreateJuntada: () => void;
  onInvite: () => void;
}

export function EmptyGroupState({ memberCount, onCreateJuntada, onInvite }: EmptyGroupStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-noche-media rounded-2xl p-6 text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border border-niebla/15" />
          <div className="absolute inset-2 rounded-full border border-niebla/10" />
          <div className="absolute inset-[25%] rounded-full bg-fuego/10" />
        </div>
        <p className="font-semibold text-[15px] text-humo mb-1">
          Todavía no hay juntadas.
        </p>
        <p className="text-sm text-niebla mb-4">
          ¿Quién arranca?
        </p>
        <Button onClick={onCreateJuntada}>Crear juntada</Button>
      </div>

      {memberCount < 4 && (
        <div className="bg-noche-media rounded-2xl p-4 text-center">
          <p className="text-sm text-niebla mb-3">
            Un grupo de {memberCount} da para más. Sumá gente.
          </p>
          <Button primary={false} onClick={onInvite}>Copiar link de invitación</Button>
        </div>
      )}

      <div className="bg-noche-media rounded-2xl p-4">
        <p className="text-xs text-niebla mb-3">
          Tu grupo recién empieza. Con 3 juntadas se desbloquean los rankings.
        </p>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div className="bg-fuego rounded-full h-2 transition-all" style={{ width: "0%" }} />
        </div>
        <p className="text-[11px] text-niebla/60 mt-1.5">0 de 3 juntadas</p>
      </div>
    </div>
  );
}
