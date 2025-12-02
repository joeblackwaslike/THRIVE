import { gql } from '@apollo/client';
import { create } from 'zustand';
import { graphqlClient } from '../lib/graphql';
import type { Document } from '../types';

interface DocumentsState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  addDocument: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  getDocumentById: (id: string) => Document | undefined;
  getDocumentsByApplication: (applicationId: string) => Document[];
  getDocumentsByType: (type: string) => Document[];
  updateVersionName: (id: string, versionName: string) => Promise<Document>;
  linkDocumentToApplications: (documentId: string, applicationIds: string[]) => Promise<Document>;
  unlinkDocumentFromApplication: (documentId: string, applicationId: string) => Promise<Document>;
  clearDocuments: () => void;
}

const GET_DOCUMENTS = gql`
  query GetDocuments {
    documents {
      id
      name
      type
      url
      fileSize
      mimeType
      applicationId
      notes
      createdAt
      updatedAt
    }
  }
`;

const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: DocumentInput!) {
    createDocument(input: $input) {
      id
      name
      type
      url
      fileSize
      mimeType
      applicationId
      notes
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: ID!, $input: DocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      name
      type
      url
      fileSize
      mimeType
      applicationId
      notes
      createdAt
      updatedAt
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.query({
        query: GET_DOCUMENTS,
        fetchPolicy: 'network-only',
      });

      set({ documents: (data as any).documents, loading: false });
    } catch (error) {
      const status = (error as any)?.networkError?.statusCode;
      const isUnauthorized = status === 401 || (error as any)?.name === 'ServerError';
      console.error('Error fetching documents:', error);
      set({
        error: isUnauthorized ? 'Unauthorized: please login' : 'Failed to fetch documents',
        loading: false,
        documents: [],
      });
    }
  },

  addDocument: async (document) => {
    set({ loading: true, error: null });
    try {
      const input = {
        ...document,
        type: document.type ? (document.type as any).toString().replace(/-/g, '_') : document.type,
      } as any;
      const { data } = await graphqlClient.mutate({
        mutation: CREATE_DOCUMENT,
        variables: { input },
      });

      const newDocument = (data as any).createDocument;
      set((state) => ({
        documents: [...state.documents, newDocument],
        loading: false,
      }));

      return newDocument;
    } catch (error) {
      console.error('Error creating document:', error);
      set({ error: 'Failed to create document', loading: false });
      throw error;
    }
  },

  updateDocument: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const input = {
        ...updates,
        type: updates.type ? (updates.type as any).toString().replace(/-/g, '_') : updates.type,
      } as any;
      const { data } = await graphqlClient.mutate({
        mutation: UPDATE_DOCUMENT,
        variables: { id, input },
      });

      const updatedDocument = (data as any).updateDocument;
      set((state) => ({
        documents: state.documents.map((document) =>
          document.id === id ? updatedDocument : document
        ),
        loading: false,
      }));

      return updatedDocument;
    } catch (error) {
      console.error('Error updating document:', error);
      set({ error: 'Failed to update document', loading: false });
      throw error;
    }
  },

  deleteDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      await graphqlClient.mutate({
        mutation: DELETE_DOCUMENT,
        variables: { id },
      });

      set((state) => ({
        documents: state.documents.filter((document) => document.id !== id),
        loading: false,
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ error: 'Failed to delete document', loading: false });
      throw error;
    }
  },

  getDocumentById: (id) => {
    return get().documents.find((document) => document.id === id);
  },

  getDocumentsByApplication: (applicationId) => {
    return get().documents.filter((document) => document.applicationId === applicationId);
  },

  getDocumentsByType: (type) => {
    return get().documents.filter((document) => document.type === type);
  },

  updateVersionName: async (id: string, versionName: string) => {
    const { data } = await graphqlClient.mutate({
      mutation: UPDATE_DOCUMENT,
      variables: { id, input: { versionName } },
    });
    const updatedDocument = (data as any).updateDocument;
    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === id ? updatedDocument : document
      ),
    }));
    return updatedDocument;
  },

  linkDocumentToApplications: async (documentId: string, applicationIds: string[]) => {
    // This would need to be implemented in the GraphQL schema
    // For now, we'll just update the document with the first application ID
    if (applicationIds.length > 0) {
      const { data } = await graphqlClient.mutate({
        mutation: UPDATE_DOCUMENT,
        variables: { id: documentId, input: { applicationId: applicationIds[0] } },
      });
      const updatedDocument = (data as any).updateDocument;
      set((state) => ({
        documents: state.documents.map((document) =>
          document.id === documentId ? updatedDocument : document
        ),
      }));
      return updatedDocument;
    }
    return get().documents.find((d) => d.id === documentId)!;
  },

  unlinkDocumentFromApplication: async (documentId: string, applicationId: string) => {
    // This would need to be implemented in the GraphQL schema
    // For now, we'll just clear the application ID if it matches
    const document = get().documents.find((d) => d.id === documentId);
    if (document && document.applicationId === applicationId) {
      const { data } = await graphqlClient.mutate({
        mutation: UPDATE_DOCUMENT,
        variables: { id: documentId, input: { applicationId: undefined } },
      });
      const updatedDocument = (data as any).updateDocument;
      set((state) => ({
        documents: state.documents.map((doc) => (doc.id === documentId ? updatedDocument : doc)),
      }));
      return updatedDocument;
    }
    return document!;
  },

  clearDocuments: () => {
    set({ documents: [] });
  },
}));
