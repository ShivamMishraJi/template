"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import {
  DEFAULT_BRAND_LOGO_JPG,
  DEFAULT_BRAND_LOGO_PNG,
} from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({ className, imageClassName }: BrandLogoProps) {
  const [src, setSrc] = useState(DEFAULT_BRAND_LOGO_PNG);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/90 text-primary-foreground",
          className,
        )}
      >
        <Shield className="h-5 w-5" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={cn("h-9 w-9 shrink-0 rounded-md object-contain", imageClassName, className)}
      onError={() => {
        if (src === DEFAULT_BRAND_LOGO_PNG) {
          setSrc(DEFAULT_BRAND_LOGO_JPG);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
