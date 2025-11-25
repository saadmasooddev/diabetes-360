import { BASE_URL } from "@/utils/env";
import React from "react";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  pointToServer?: boolean;
}


export const Image: React.FC<ImageProps> = ({
  src,
  pointToServer = false,
  className,
  ...props
}) => {
  const resolvedSrc =
    pointToServer && src && !src.startsWith("http")
      ? `${BASE_URL}${BASE_URL.includes("localhost") ? "" : "/public"}/${src.startsWith("/") ? src.substring(1) : src}`
      : src;


  return (
    <img
      src={resolvedSrc}
      className={className}
      {...props}
    />
  );
};
