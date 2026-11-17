import styled from "styled-components";
import { Skeleton } from "@banking/shared/ui/components/skeleton";

export const FallbackRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const SkeletonGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
`;

export const SkeletonBlock = styled(Skeleton)<{ $height: string }>`
  width: 100%;
  height: ${({ $height }) => $height};
`;
