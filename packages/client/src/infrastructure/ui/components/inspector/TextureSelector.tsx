import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useServices } from "../../hooks/useServices";
import { useI18n } from "../../hooks/useI18n";

type Props = { value?: string | null; onChange: (v: string | null) => void };

export default function TextureSelector({ value, onChange }: Props) {
  const services = useServices();
  const { t } = useI18n();
  const catalog = services.textureCatalog;

  const [textures, setTextures] = useState<Array<any>>([]);

  useEffect(() => {
    if (!catalog) return;
    let mounted = true;

    // Load initial catalog
    (async () => {
      try {
        const cat = await catalog.getCatalog();
        if (mounted) setTextures(cat.variants || []);
      } catch (e) {
        // noop
      }
    })();

    // Subscribe to updates
    const unsub = catalog.subscribe
      ? catalog.subscribe((cat: any) => {
          if (mounted) setTextures(cat.variants || []);
        })
      : undefined;

    return () => {
      mounted = false;
      try {
        unsub && unsub();
      } catch {}
    };
  }, [catalog]);

  const exists = !value || textures.find((t2: any) => t2.id === value);

  return (
    <div>
      <select
        class="select-input"
        value={value || ""}
        onChange={(e: any) => onChange(e.target.value || null)}
      >
        <option value="">{t("inspector.none", "None")}</option>
        {textures.map((tx: any) => (
          <option key={tx.id} value={tx.id}>
            {tx.id}
          </option>
        ))}
      </select>
      {!exists && (
        <div class="invalid-ref">
          {t("inspector.invalidTexture", "Texture not found")}
        </div>
      )}
    </div>
  );
}
