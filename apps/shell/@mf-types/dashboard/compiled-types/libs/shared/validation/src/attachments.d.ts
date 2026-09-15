import { z } from "zod";
import type { AttachmentMetadataInput } from "@banking/shared/types";
export declare const attachmentMetadataSchema: z.ZodType<AttachmentMetadataInput>;
export declare function createAttachmentListSchema(existingAttachmentCount?: number): z.ZodArray<z.ZodType<AttachmentMetadataInput, z.ZodTypeDef, AttachmentMetadataInput>, "many">;
