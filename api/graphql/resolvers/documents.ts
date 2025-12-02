import { GraphQLError } from 'graphql';
import { documents as documentsDb } from '../../lib/db.ts';
import { supabase, supabaseAdmin } from '../../lib/supabase.ts';
import logger from '../../logger.ts';
import type {
  Context,
  CreateDocumentArgs,
  DeleteDocumentArgs,
  DocumentQueryArgs,
  DocumentRecord,
  UpdateDocumentArgs,
} from '../types.ts';

export const documentsResolver = {
  Query: {
    documents: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        return await documentsDb.getAll(userId);
      } catch (_error) {
        logger.error('Error fetching documents:', _error);
        return [];
      }
    },

    document: async (_: unknown, { id }: DocumentQueryArgs, { userId }: Context) => {
      try {
        return await documentsDb.getById(id, userId);
      } catch (_error) {
        logger.error('Error fetching document:', _error);
        return null;
      }
    },

    documentsByApplication: async (
      _: unknown,
      { applicationId }: { applicationId: string },
      { userId }: Context
    ) => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', applicationId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error fetching documents by application:', error);
          return [];
        }
        return data;
      } catch (_error) {
        logger.error('Error fetching documents by application:', _error);
        return [];
      }
    },

    documentVersions: async (
      _: unknown,
      { baseDocumentId }: { baseDocumentId: string },
      { userId }: Context
    ) => {
      try {
        return await documentsDb.getVersions(baseDocumentId, userId);
      } catch (_error) {
        logger.error('Error fetching document versions:', _error);
        return [];
      }
    },
  },

  Mutation: {
    createDocument: async (_: unknown, { input }: CreateDocumentArgs, { userId }: Context) => {
      try {
        logger.info('Document resolver debug - userId received:', userId);
        logger.info('Document resolver debug - input:', input);

        // Ensure user is authenticated
        if (!userId) {
          logger.error('Document resolver debug - Authentication failed: userId is null');
          throw new GraphQLError('Authentication required to upload documents');
        }

        // Ensure a mirror row exists in public.users for this auth.uid()
        try {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
          if (!userRow) {
            logger.warn('Document resolver debug - User not found in public.users:', userId);
            // Get user info from auth.users first
            const { data: authUser } = await supabaseAdmin
              .from('auth.users')
              .select('email')
              .eq('id', userId)
              .single();

            await supabaseAdmin.from('users').upsert(
              {
                id: userId,
                email: authUser?.email || 'unknown@example.com',
              },
              { onConflict: 'id' }
            );
          }
        } catch (_) {
          // Proceed; RLS/constraints will catch if truly invalid
        }
        let uploadUrl = input.url || input.fileUrl || null;
        let fileName = input.fileName || null;
        let mimeType = input.mimeType || null;
        let buffer: Buffer | null = null;

        logger.info('Document upload debug - Input:', {
          hasFileUrl: !!input.fileUrl,
          hasContent: !!input.content,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        });

        if (input.fileUrl?.startsWith('data:')) {
          const [meta, data] = input.fileUrl.split(',');
          const m = /data:(.*?);base64/.exec(meta || '');
          mimeType = mimeType || (m ? m[1] : null);
          buffer = Buffer.from(data, 'base64');
          logger.debug('Document upload debug - Base64 data URI parsed:', {
            meta,
            mimeType,
            dataLength: data?.length,
          });
        } else if (input.content) {
          buffer = Buffer.from(input.content, 'utf8');
          mimeType = mimeType || 'text/plain';
          logger.debug(
            'Document upload debug - Text content provided, length:',
            input.content.length
          );
        }

        if (buffer) {
          const ext = (() => {
            if (mimeType?.includes('pdf')) return 'pdf';
            if (mimeType?.includes('markdown')) return 'md';
            if (mimeType === 'text/plain') return 'txt';
            if (mimeType?.includes('html')) return 'html';
            if (mimeType?.includes('msword')) return 'doc';
            if (mimeType?.includes('officedocument')) return 'docx';
            return (fileName?.split('.').pop() || '').toLowerCase() || 'bin';
          })();
          const base = (input.name || fileName || 'document')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64);
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${base}.${ext}`;
          logger.debug(
            'Document upload debug - Uploading to path:',
            path,
            'with mimeType:',
            mimeType
          );

          try {
            const { error: uploadError } = await supabaseAdmin.storage
              .from('documents')
              .upload(path, buffer, { contentType: mimeType || 'application/octet-stream' });
            if (uploadError) {
              logger.error('Document upload debug - Supabase upload error:', uploadError);
              throw uploadError;
            }
            logger.debug('Document upload debug - Supabase upload successful');
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('documents')
              .getPublicUrl(path);
            uploadUrl = publicUrlData.publicUrl;
            fileName = fileName || `${base}.${ext}`;
            logger.debug('Document upload debug - Public URL generated:', uploadUrl);
          } catch (uploadErr) {
            logger.error('Document upload debug - Upload failed:', uploadErr);
            throw uploadErr;
          }
        }

        const documentData = {
          user_id: userId,
          name: input.name,
          type: (input.type as any)?.toString().replace(/_/g, '-'),
          file_name: fileName || input.fileName || null,
          file_url: uploadUrl || input.fileUrl || null,
          url: uploadUrl || input.url || null,
          file_size: input.fileSize || (buffer ? buffer.length : null),
          mime_type: mimeType || input.mimeType || null,
          content: input.content || null,
          version: input.version ?? 1,
          version_name: input.versionName || null,
          base_document_id: input.baseDocumentId || null,
          application_id: input.applicationId || null,
          used_in_application_ids: input.usedInApplicationIds || null,
          last_used_date: input.lastUsedDate || null,
          tags: input.tags || null,
          notes: input.notes || null,
          deleted_at: input.deletedAt || null,
        } as any;

        const { data, error } = await supabaseAdmin
          .from('documents')
          .insert(documentData)
          .select()
          .single();
        if (error) throw error;
        return data as any;
      } catch (error: any) {
        const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        logger.error('Document upload debug - Final error caught:', error);
        logger.error('Document upload debug - Error stack:', error?.stack);
        throw new GraphQLError(`Failed to create document: ${msg}`);
      }
    },

    updateDocument: async (_: unknown, { id, input }: UpdateDocumentArgs, { userId }: Context) => {
      try {
        // Ensure user is authenticated
        if (!userId) {
          throw new GraphQLError('Authentication required to update documents');
        }
        let uploadUrl = input.url || input.fileUrl || null;
        let fileName = input.fileName || null;
        let mimeType = input.mimeType || null;
        let buffer: Buffer | null = null;

        if (input.fileUrl?.startsWith('data:')) {
          const [meta, data] = input.fileUrl.split(',');
          const m = /data:(.*?);base64/.exec(meta || '');
          mimeType = mimeType || (m ? m[1] : null);
          buffer = Buffer.from(data, 'base64');
        } else if (input.content) {
          buffer = Buffer.from(input.content, 'utf8');
          mimeType = mimeType || 'text/plain';
        }

        if (buffer) {
          const ext = (() => {
            if (mimeType?.includes('pdf')) return 'pdf';
            if (mimeType?.includes('markdown')) return 'md';
            if (mimeType === 'text/plain') return 'txt';
            if (mimeType?.includes('html')) return 'html';
            if (mimeType?.includes('msword')) return 'doc';
            if (mimeType?.includes('officedocument')) return 'docx';
            return (fileName?.split('.').pop() || '').toLowerCase() || 'bin';
          })();
          const base = (input.name || fileName || 'document')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64);
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${base}.${ext}`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from('documents')
            .upload(path, buffer, { contentType: mimeType || 'application/octet-stream' });
          if (uploadError) {
            logger.error('Document upload debug - Supabase upload error:', uploadError);
            throw uploadError;
          }
          logger.debug('Document upload debug - Supabase upload successful');
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('documents')
            .getPublicUrl(path);
          uploadUrl = publicUrlData.publicUrl;
          fileName = fileName || `${base}.${ext}`;
          logger.debug('Document upload debug - Public URL generated:', uploadUrl);
        }

        const updateData = {
          name: input.name,
          type: (input.type as any)?.toString().replace(/_/g, '-'),
          file_name: fileName || input.fileName || null,
          file_url: uploadUrl || input.fileUrl || null,
          url: uploadUrl || input.url || null,
          file_size: input.fileSize || (buffer ? buffer.length : null),
          mime_type: mimeType || input.mimeType || null,
          content: input.content || null,
          version: input.version,
          version_name: input.versionName || null,
          base_document_id: input.baseDocumentId || null,
          application_id: input.applicationId || null,
          used_in_application_ids: input.usedInApplicationIds || null,
          last_used_date: input.lastUsedDate || null,
          tags: input.tags || null,
          notes: input.notes || null,
          deleted_at: input.deletedAt || null,
        } as any;

        const { data, error } = await supabaseAdmin
          .from('documents')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) {
          logger.error('Document upload debug - Update error:', error);
          throw error;
        }
        logger.debug('Document upload debug - Update successful');
        return data as any;
      } catch (error: any) {
        const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        logger.error('Document upload debug - Final error caught:', error);
        logger.error('Document upload debug - Error stack:', error?.stack);
        throw new GraphQLError(`Failed to update document: ${msg}`);
      }
    },

    deleteDocument: async (_: unknown, { id }: DeleteDocumentArgs, { userId }: Context) => {
      try {
        // Ensure user is authenticated
        if (!userId) {
          throw new GraphQLError('Authentication required to delete documents');
        }
        return await documentsDb.delete(id, userId);
      } catch (error) {
        logger.error('Document upload debug - Delete error:', error);
        throw new GraphQLError(`Failed to delete document: ${error}`);
      }
    },
  },

  Document: {
    userId: (parent: DocumentRecord) => parent.user_id,
    fileName: (parent: DocumentRecord) => parent.file_name,
    fileUrl: (parent: DocumentRecord) => parent.file_url,
    fileSize: (parent: DocumentRecord) => parent.file_size,
    mimeType: (parent: DocumentRecord) => parent.mime_type,
    baseDocumentId: (parent: DocumentRecord) => parent.base_document_id,
    applicationId: (parent: DocumentRecord) => parent.application_id,
    usedInApplicationIds: (parent: DocumentRecord) => parent.used_in_application_ids,
    lastUsedDate: (parent: DocumentRecord) => parent.last_used_date,
    deletedAt: (parent: DocumentRecord) => parent.deleted_at,
    createdAt: (parent: DocumentRecord) => parent.created_at,
    updatedAt: (parent: DocumentRecord) => parent.updated_at,

    application: async (parent: DocumentRecord, _: unknown, { userId }: Context) => {
      if (!parent.application_id) return null;

      const { applications } = await import('../../lib/db');
      return await applications.getById(parent.application_id, userId);
    },

    baseDocument: async (parent: DocumentRecord, _: unknown, { userId }: Context) => {
      if (!parent.base_document_id) return null;

      return await documentsDb.getById(parent.base_document_id, userId);
    },

    versions: async (parent: DocumentRecord, _: unknown, { userId }: Context) => {
      return await documentsDb.getVersions(parent.id, userId);
    },
  },
};
