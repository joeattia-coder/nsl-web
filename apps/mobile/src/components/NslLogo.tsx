import { SvgUri } from "react-native-svg";

import { apiBaseUrl } from "../lib/public-api";

type NslLogoProps = {
  width?: number;
  height?: number;
};

export function NslLogo({ width = 144, height = 170 }: NslLogoProps) {
  return <SvgUri uri={`${apiBaseUrl}/images/nsl-logo.svg`} width={width} height={height} />;
}