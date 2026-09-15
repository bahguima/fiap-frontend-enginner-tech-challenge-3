import styled from "styled-components";

export const DetailsList = styled.dl`
  display: grid;
  margin: 1.5rem 0 0;
`;

export const DetailsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid hsl(var(--border) / 0.35);

  &:last-child {
    border-bottom: 0;
  }
`;

export const DetailsLabel = styled.dt`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
`;

export const DetailsValue = styled.dd`
  margin: 0;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const AttachmentDetailsRow = styled(DetailsRow)`
  align-items: flex-start;
`;

export const AttachmentList = styled.ul`
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: right;
`;

export const AttachmentItem = styled.li`
  display: grid;
  gap: 0.125rem;
`;

export const AttachmentName = styled.span`
  overflow-wrap: anywhere;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const AttachmentMeta = styled.span`
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  font-weight: 400;
`;

export const AttachmentStatus = styled.span`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  font-weight: 400;
`;

export const RetryAttachmentsButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
`;
