import Svg, { Circle, Path, Rect } from "react-native-svg";

import type { TabRouteName } from "../types/app";

type TabBarIconProps = {
  routeName: TabRouteName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

export function TabBarIcon({ routeName, color, size = 22, strokeWidth = 1.5 }: TabBarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {routeName === "Home" ? <HomeIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "Tournaments" ? <TrophyIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "Matches" ? <CalendarIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "Score" ? <ChartIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "Profile" ? <ProfileIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "Overview" ? <GridIcon color={color} strokeWidth={strokeWidth} /> : null}
      {routeName === "League" ? <TableIcon color={color} strokeWidth={strokeWidth} /> : null}
    </Svg>
  );
}

function HomeIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Path d="M3.75 10.5 12 3.75l8.25 6.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5.25 9.75V20.25H18.75V9.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.125 20.25v-5.625h3.75v5.625" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function TrophyIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Path d="M8.25 4.5h7.5v3A3.75 3.75 0 0 1 12 11.25 3.75 3.75 0 0 1 8.25 7.5v-3Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.25 5.25H5.625A1.875 1.875 0 0 0 3.75 7.125c0 1.905 1.173 3.309 3.375 3.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.75 5.25h2.625a1.875 1.875 0 0 1 1.875 1.875c0 1.905-1.173 3.309-3.375 3.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 11.25v3.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 19.5h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10.125 15h3.75v4.5h-3.75z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </>
  );
}

function CalendarIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Rect x="3.75" y="5.25" width="16.5" height="15" rx="2.25" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M7.5 3.75v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16.5 3.75v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3.75 9.75h16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8.25 13.125h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8.25 16.875h7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  );
}

function ChartIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Path d="M4.5 19.5h15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x="6" y="11.25" width="2.625" height="6.75" rx="0.75" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="10.6875" y="7.5" width="2.625" height="10.5" rx="0.75" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="15.375" y="9.375" width="2.625" height="8.625" rx="0.75" stroke={color} strokeWidth={strokeWidth} />
    </>
  );
}

function ProfileIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Circle cx="12" cy="8.25" r="3.375" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M5.25 19.125c1.35-2.46 3.855-3.75 6.75-3.75s5.4 1.29 6.75 3.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  );
}

function GridIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Rect x="4.5" y="4.5" width="6.375" height="6.375" rx="1.125" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13.125" y="4.5" width="6.375" height="6.375" rx="1.125" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="4.5" y="13.125" width="6.375" height="6.375" rx="1.125" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13.125" y="13.125" width="6.375" height="6.375" rx="1.125" stroke={color} strokeWidth={strokeWidth} />
    </>
  );
}

function TableIcon({ color, strokeWidth }: IconShapeProps) {
  return (
    <>
      <Rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2.25" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3.75 9.75h16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9.75 9.75v9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14.25 9.75v9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3.75 14.25h16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>
  );
}

type IconShapeProps = {
  color: string;
  strokeWidth: number;
};
