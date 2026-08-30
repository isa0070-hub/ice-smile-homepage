import Image from "next/image";

const DIRECT_IMAGE_HOSTS = new Set([
  "images.ismileagain.co.kr",
  "lrgthpvydwpfjkczxwur.supabase.co",
]);

const NEXT_IMAGE_ONLY_PROPS = [
  "blurDataURL",
  "fill",
  "lazyBoundary",
  "lazyRoot",
  "layout",
  "loader",
  "objectFit",
  "objectPosition",
  "onLoadingComplete",
  "overrideSrc",
  "placeholder",
  "preload",
  "priority",
  "quality",
  "sizes",
  "unoptimized",
];

export function shouldServeImageDirectly(src) {
  if (typeof src !== "string" || !src.startsWith("https://")) {
    return false;
  }

  try {
    return DIRECT_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export default function SiteImage(imageProps) {
  const { src, alt } = imageProps;

  if (shouldServeImageDirectly(src)) {
    const {
      fill = false,
      width,
      height,
      loading,
      decoding,
      fetchPriority,
      priority = false,
      preload = false,
      overrideSrc,
      style,
    } = imageProps;
    const nativeProps = { ...imageProps };

    for (const prop of NEXT_IMAGE_ONLY_PROPS) {
      delete nativeProps[prop];
    }

    const directStyle = fill
      ? {
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          ...style,
          color: "transparent",
        }
      : { color: "transparent", ...style };

    return (
      // These trusted CDN images are intentionally served without Next/Vercel
      // transformations so the public site is not tied to a paid quota.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...nativeProps}
        src={overrideSrc || src}
        alt={alt}
        loading={loading || (priority || preload ? "eager" : "lazy")}
        decoding={decoding || "async"}
        fetchPriority={
          fetchPriority || (priority || preload ? "high" : undefined)
        }
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        style={directStyle}
      />
    );
  }

  return <Image {...imageProps} alt={alt} />;
}
