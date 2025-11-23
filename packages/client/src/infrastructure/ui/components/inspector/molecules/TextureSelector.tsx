import { useState, useEffect, useContext } from "preact/hooks";
import { ServicesContext } from "../../../hooks/useServices";
import type { TextureVariant } from "@client/application/TextureCatalog";
import LazyThumbnail from "./LazyThumbnail";
import { Button } from "../../common/atoms/Button";
import OverlayPopup from "../../common/molecules/OverlayPopup";
import { FilterableSelect } from "../../common/molecules";

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
};

export function TextureSelector({ value, onChange }: Props) {
  const services = useContext(ServicesContext);
  const [query, setQuery] = useState("");
  const [variants, setVariants] = useState<TextureVariant[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    async function load() {
      if (!services || !services.textureCatalog) {
        setVariants([]);
        return;
      }
      try {
        const cat = await services.textureCatalog.getCatalog();
        if (!mounted) return;
        setVariants(cat.variants || []);
        // subscribe to updates if provided
        if (services.textureCatalog.subscribe) {
          unsubscribe = services.textureCatalog.subscribe((c) => {
            if (!mounted) return;
            setVariants(c.variants || []);
          });
        }
      } catch {
        if (mounted) setVariants([]);
      }
    }
    load();
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [services]);

  // Representative variant per id
  const repById = new Map<string, TextureVariant>();
  const qualityRank: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    ultra: 3,
  };
  for (const v of variants) {
    const cur = repById.get(v.id);
    if (!cur) repById.set(v.id, v);
    else {
      const curRank = qualityRank[(cur.quality as string) ?? "low"] ?? 0;
      const newRank = qualityRank[(v.quality as string) ?? "low"] ?? 0;
      if (newRank > curRank) repById.set(v.id, v);
    }
  }

  const unique = Array.from(repById.values());
  const filteredUnique = unique.filter(
    (u) =>
      u.label?.toLowerCase().includes(query.toLowerCase()) ||
      u.id.toLowerCase().includes(query.toLowerCase())
  );

  const options = filteredUnique.map((v) => ({
    value: v.id,
    label: v.label ?? v.id,
    // prefer a provided thumbnail if available, otherwise the original path (will be downscaled lazily)
    thumbnail: (v as any).thumbnail ?? v.path,
    group: v.id.includes("/") ? v.id.split("/")[0] : "others",
  }));

  const selectedVariant = unique.find((u) => u.id === value) ?? null;

  // click outside to close overlay
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      // if click is outside of the popup overlay close
      const popup = (target as Element).closest?.(".create-entity-popup");
      if (!popup) setOpen(false);
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {variants.length === 0 ? (
          <div className="small-label">No textures</div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: "1 1 auto",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 40,
                  border: "1px dashed rgba(255,255,255,0.04)",
                  background: "transparent",
                }}
              >
                {selectedVariant ? (
                  <LazyThumbnail
                    src={
                      (selectedVariant as any).thumbnail ?? selectedVariant.path
                    }
                    width={56}
                    height={40}
                  />
                ) : null}
              </div>
              <div style={{ flex: "1 1 auto" }}>
                {selectedVariant
                  ? selectedVariant.label ?? selectedVariant.id
                  : "(none)"}
              </div>
            </div>
            <div>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setOpen((s) => !s)}
                aria-expanded={open}
              >
                {open ? "Close" : "Change"}
              </Button>
            </div>
            {open ? (
              <OverlayPopup
                open={open}
                onClose={() => setOpen(false)}
                width={520}
              >
                <FilterableSelect
                  value={value ?? ""}
                  options={options}
                  initialFilter={
                    selectedVariant
                      ? selectedVariant.label ?? selectedVariant.id
                      : ""
                  }
                  onChange={(v) => {
                    onChange(v === "" ? null : v);
                    setOpen(false);
                  }}
                  placeholder="(none)"
                  filterPlaceholder="Filter textures..."
                />
              </OverlayPopup>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
