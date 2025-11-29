import { useState, useEffect, useContext } from "preact/hooks";
import { ServicesContext } from "../../../hooks/useServices";
import type { TextureVariant } from "@client/application/TextureCatalog";
import LazyThumbnail from "./LazyThumbnail";
import { Button } from "../../common/atoms/Button";
import OverlayPopup from "../../common/molecules/OverlayPopup";
import { FilterableSelect } from "../../common/molecules";
import './texture-selector.css';

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

  // Use catalog id as the selectable value so inspector stores ids (components expect ids)
  const options = filteredUnique.map((v) => ({
    value: v.id,
    label: v.label ?? v.id,
    // prefer a provided thumbnail if available, otherwise the original path (will be downscaled lazily)
    thumbnail: (v as any).thumbnail ?? v.path,
    group: v.id.includes("/") ? v.id.split("/")[0] : "others",
    // expose both id and path for selection resolution
    path: v.path,
  }));

  // The stored `value` may be either a catalog id or a resolved path; accept both
  const selectedVariant =
    unique.find((u) => u.id === value || u.path === value) ?? null;

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
    <div className="texture-selector">
      {variants.length === 0 ? (
        <div className="small-label">No textures</div>
      ) : (
        <>
          {/* Left block: thumbnail + label (shrinkable) */}
          <div className="texture-selector__left">
            <div className="texture-selector__thumbnail">
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

            {/* Truncatable label */}
            <div className="texture-selector__label" title={selectedVariant ? selectedVariant.label ?? selectedVariant.id : "(none)"}>
              {selectedVariant ? selectedVariant.label ?? selectedVariant.id : "(none)"}
            </div>
          </div>

          {/* Right block: fixed button */}
          <div className="texture-selector__button">
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
            <OverlayPopup open={open} onClose={() => setOpen(false)} width={"min(520px, 90vw)"}>
              <FilterableSelect
                value={value ?? ""}
                options={options}
                initialFilter={selectedVariant ? selectedVariant.label ?? selectedVariant.id : ""}
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
  );
}
