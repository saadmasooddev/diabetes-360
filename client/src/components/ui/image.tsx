import { BASE_URL } from "@/utils/httpClient";
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
    pointToServer && src && !src.startsWith("http") && !src.startsWith("/")
      ? `${BASE_URL}/${src}`
      : src;


  return (
    <img
      src={resolvedSrc}
      className={className}
      {...props}
    />
  );
};
