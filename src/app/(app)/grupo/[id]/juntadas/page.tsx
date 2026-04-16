import HistorialPage from "../historial/page";

export default function JuntadasAlias({ params }: { params: Promise<{ id: string }> }) {
  return <HistorialPage params={params} />;
}
