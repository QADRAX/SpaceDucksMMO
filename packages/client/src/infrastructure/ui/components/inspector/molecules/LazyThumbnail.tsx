import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getThumbnail, revokeThumbnail } from '../../../utils/thumbnailer';

type Props = {
  src: string | null | undefined;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
};

export default function LazyThumbnail({ src, width = 48, height = 32, alt = '', className }: Props) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setThumb(null);
      return;
    }

    // asynchronously generate or fetch thumbnail
    (async () => {
      try {
        const t = await getThumbnail(src, width, height);
        if (!cancelled) setThumb(t);
      } catch (e) {
        if (!cancelled) setThumb(src);
      }
    })();

    return () => {
      cancelled = true;
      if (thumb && thumb.startsWith('blob:')) revokeThumbnail(thumb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!src) {
    return <div style={{ width, height, background: '#222' }} className={className} />;
  }

  return (
    <img
      src={thumb || src}
      width={width}
      height={height}
      alt={alt}
      className={className}
      style={{ objectFit: 'cover', width, height }}
      loading="lazy"
    />
  );
}
