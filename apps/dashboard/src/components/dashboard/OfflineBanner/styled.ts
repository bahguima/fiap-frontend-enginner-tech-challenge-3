import styled from "styled-components";

export const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid hsl(var(--destructive) / 0.4);
  background: hsl(var(--destructive) / 0.12);
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  padding: 0.5rem 1rem;

  svg {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    color: hsl(var(--destructive));
  }
`;
