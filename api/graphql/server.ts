import type { Server } from 'node:http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
import type { Express } from 'express';
import { getUserIdFromRequest, optionalAuth } from '../lib/auth';

// Import resolvers
import { analyticsResolver } from './resolvers/analytics';
// Import resolvers
import { applicationsResolver } from './resolvers/applications';
import { companiesResolver } from './resolvers/companies';
import { contactsResolver } from './resolvers/contacts';
import { documentsResolver } from './resolvers/documents';
import { interviewsResolver } from './resolvers/interviews';

// GraphQL type definitions
const typeDefs = `
  scalar Date
  scalar JSON

  enum ApplicationStatus {
    target
    hunting
    applied
    interviewing
    offer
    accepted
    rejected
    withdrawn
  }

  enum WorkType {
    remote
    hybrid
    onsite
  }

  enum EmploymentType {
    full_time
    part_time
    contract
    internship
  }

  enum Priority {
    low
    medium
    high
  }

  enum InterviewType {
    recruiter_screen
    phone_screen
    hiring_manager_chat
    video
    technical_assessment
    on_site
    technical_interview
    behavioral_interview
    leadership_interview
    panel
    final
    other
  }

  enum InterviewStatus {
    scheduled
    completed
    cancelled
    rescheduled
    no_show
  }

  enum InterviewResult {
    passed
    failed
    pending
  }

  enum DocumentType {
    resume
    cv
    cover_letter
    portfolio
    transcript
    certification
    other
  }

  type SalaryRange {
    min: Int
    max: Int
    currency: String
    period: String
  }

  type DocumentVersionLink {
    documentId: String!
    documentName: String!
    documentType: DocumentType!
    version: Int!
    versionName: String
    linkedAt: Date!
    content: String
  }

  type Application {
    id: ID!
    userId: String!
    companyName: String!
    position: String!
    status: ApplicationStatus!
    targetDate: Date
    appliedDate: Date
    firstInterviewDate: Date
    offerDate: Date
    responseDeadline: Date
    createdAt: Date!
    updatedAt: Date!
    location: String
    workType: WorkType
    employmentType: EmploymentType
    salaryMin: Int
    salaryMax: Int
    salaryCurrency: String
    salaryPeriod: String
    jobUrl: String
    jobDescription: String
    notes: String
    tags: [String]
    priority: Priority
    source: String
    referralName: String
    sortOrder: Int
    interviews: [Interview!]!
    linkedDocuments: [DocumentVersionLink!]!
  }

  type Interviewer {
    id: ID!
    name: String!
    title: String
    linkedin: String
    email: String
    notes: String
  }

  type Interview {
    id: ID!
    userId: String!
    applicationId: String!
    round: Int!
    type: InterviewType!
    status: InterviewStatus!
    scheduledAt: Date
    duration: Int
    location: String
    meetingUrl: String
    preparationNotes: String
    questionsAsked: [String]
    questionsToAsk: [String]
    feedback: String
    followUpSent: Boolean
    followUpDate: Date
    result: InterviewResult
    createdAt: Date!
    updatedAt: Date!
    interviewers: [Interviewer!]!
    application: Application!
  }

  type Company {
    id: ID!
    userId: String!
    name: String!
    website: String
    industry: [String]
    size: String
    location: String
    founded: String
    remotePolicy: String
    description: String
    culture: String
    cultureNotes: String
    techStack: [String]
    benefits: [String]
    pros: [String]
    cons: [String]
    notes: String
    employeeReviews: String
    newsAndUpdates: String
    competitorComparison: String
    companyLinks: JSON
    ratings: JSON
    atsParams: JSON
    interviewProcess: String
    interviewDifficulty: String
    interviewExperience: String
    salaryRange: JSON
    status: String
    priority: Priority
    researched: Boolean!
    tags: [String]
    createdAt: Date!
    updatedAt: Date!
    contacts: [Contact!]!
  }

  type Contact {
    id: ID!
    userId: String!
    name: String!
    companyId: String
    companyName: String
    title: String
    email: String
    phone: String
    linkedin: String
    notes: String
    relationship: String
    createdAt: Date!
    updatedAt: Date!
    company: Company
  }

  type Document {
    id: ID!
    userId: String!
    name: String!
    type: DocumentType!
    fileName: String
    fileUrl: String
    url: String
    fileSize: Int
    mimeType: String
    content: String
    version: Int!
    versionName: String
    baseDocumentId: String
    applicationId: String
    usedInApplicationIds: [String]
    lastUsedDate: Date
    tags: [String]
    notes: String
    deletedAt: Date
    createdAt: Date!
    updatedAt: Date!
    application: Application
    baseDocument: Document
    versions: [Document!]!
  }

  type ApplicationStats {
    total: Int!
    byStatus: JSON!
    averageResponseTime: Float
    successRate: Float
    activeApplications: Int!
    interviewsScheduled: Int!
    offersReceived: Int!
  }

  type Query {
    # Applications
    applications: [Application!]!
    application(id: ID!): Application
    applicationsByStatus(status: ApplicationStatus!): [Application!]!
    
    # Interviews
    interviews: [Interview!]!
    interview(id: ID!): Interview
    interviewsByApplication(applicationId: ID!): [Interview!]!
    
    # Companies
    companies: [Company!]!
    company(id: ID!): Company
    
    # Contacts
    contacts: [Contact!]!
    contact(id: ID!): Contact
    contactsByCompany(companyId: ID!): [Contact!]!
    
    # Documents
    documents: [Document!]!
    document(id: ID!): Document
    documentsByApplication(applicationId: ID!): [Document!]!
    documentVersions(baseDocumentId: ID!): [Document!]!
    
    # Analytics
    applicationStats: ApplicationStats!
    applicationsByStatusCount: JSON!
    applicationsOverTime(startDate: Date!, endDate: Date!): JSON!
  }

  input ApplicationInput {
    companyName: String!
    position: String!
    status: ApplicationStatus
    targetDate: Date
    appliedDate: Date
    firstInterviewDate: Date
    offerDate: Date
    responseDeadline: Date
    location: String
    workType: WorkType
    employmentType: EmploymentType
    salaryMin: Int
    salaryMax: Int
    salaryCurrency: String
    salaryPeriod: String
    jobUrl: String
    jobDescription: String
    notes: String
    tags: [String]
    priority: Priority
    source: String
    referralName: String
    sortOrder: Int
  }

  input ApplicationUpdateInput {
    companyName: String
    position: String
    status: ApplicationStatus
    targetDate: Date
    appliedDate: Date
    firstInterviewDate: Date
    offerDate: Date
    responseDeadline: Date
    location: String
    workType: WorkType
    employmentType: EmploymentType
    salaryMin: Int
    salaryMax: Int
    salaryCurrency: String
    salaryPeriod: String
    jobUrl: String
    jobDescription: String
    notes: String
    tags: [String]
    priority: Priority
    source: String
    referralName: String
    sortOrder: Int
  }

  input InterviewInput {
    applicationId: ID!
    round: Int!
    type: InterviewType!
    status: InterviewStatus
    scheduledAt: Date
    duration: Int
    location: String
    meetingUrl: String
    preparationNotes: String
    questionsAsked: [String]
    questionsToAsk: [String]
    feedback: String
    followUpSent: Boolean
    followUpDate: Date
    result: InterviewResult
  }

  input InterviewUpdateInput {
    applicationId: ID
    round: Int
    type: InterviewType
    status: InterviewStatus
    scheduledAt: Date
    duration: Int
    location: String
    meetingUrl: String
    preparationNotes: String
    questionsAsked: [String]
    questionsToAsk: [String]
    feedback: String
    followUpSent: Boolean
    followUpDate: Date
    result: InterviewResult
  }

  input CompanyInput {
    name: String!
    website: String
    industry: [String]
    size: String
    location: String
    founded: String
    remotePolicy: String
    description: String
    culture: String
    cultureNotes: String
    techStack: [String]
    benefits: [String]
    pros: [String]
    cons: [String]
    notes: String
    employeeReviews: String
    newsAndUpdates: String
    competitorComparison: String
    companyLinks: JSON
    ratings: JSON
    atsParams: JSON
    interviewProcess: String
    interviewDifficulty: String
    interviewExperience: String
    salaryRange: JSON
    status: String
    priority: Priority
    researched: Boolean
    tags: [String]
  }

  input CompanyUpdateInput {
    name: String
    website: String
    industry: [String]
    size: String
    location: String
    founded: String
    remotePolicy: String
    description: String
    culture: String
    cultureNotes: String
    techStack: [String]
    benefits: [String]
    pros: [String]
    cons: [String]
    notes: String
    employeeReviews: String
    newsAndUpdates: String
    competitorComparison: String
    companyLinks: JSON
    ratings: JSON
    atsParams: JSON
    interviewProcess: String
    interviewDifficulty: String
    interviewExperience: String
    salaryRange: JSON
    status: String
    priority: Priority
    researched: Boolean
    tags: [String]
  }

  input ContactInput {
    name: String!
    companyId: ID
    companyName: String
    title: String
    email: String
    phone: String
    linkedin: String
    notes: String
    relationship: String
  }

  input ContactUpdateInput {
    name: String
    companyId: ID
    companyName: String
    title: String
    email: String
    phone: String
    linkedin: String
    notes: String
    relationship: String
  }

  input DocumentInput {
    name: String!
    type: DocumentType!
    fileName: String
    fileUrl: String
    url: String
    fileSize: Int
    mimeType: String
    content: String
    version: Int
    versionName: String
    baseDocumentId: ID
    applicationId: ID
    usedInApplicationIds: [ID]
    lastUsedDate: Date
    tags: [String]
    notes: String
  }

  input DocumentUpdateInput {
    name: String
    type: DocumentType
    fileName: String
    fileUrl: String
    url: String
    fileSize: Int
    mimeType: String
    content: String
    version: Int
    versionName: String
    baseDocumentId: ID
    applicationId: ID
    usedInApplicationIds: [ID]
    lastUsedDate: Date
    tags: [String]
    notes: String
  }

  type Mutation {
    # Applications
    createApplication(input: ApplicationInput!): Application!
    updateApplication(id: ID!, input: ApplicationUpdateInput!): Application!
    deleteApplication(id: ID!): Boolean!
    
    # Interviews
    createInterview(input: InterviewInput!): Interview!
    updateInterview(id: ID!, input: InterviewUpdateInput!): Interview!
    deleteInterview(id: ID!): Boolean!
    
    # Companies
    createCompany(input: CompanyInput!): Company!
    updateCompany(id: ID!, input: CompanyUpdateInput!): Company!
    deleteCompany(id: ID!): Boolean!
    
    # Contacts
    createContact(input: ContactInput!): Contact!
    updateContact(id: ID!, input: ContactUpdateInput!): Contact!
    deleteContact(id: ID!): Boolean!
    
    # Documents
    createDocument(input: DocumentInput!): Document!
    updateDocument(id: ID!, input: DocumentUpdateInput!): Document!
    deleteDocument(id: ID!): Boolean!
  }
`;

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: [
    { Date: new GraphQLScalarType({
        name: 'Date',
        serialize(value: any) {
          const d = value instanceof Date ? value : new Date(value);
          return d.toISOString();
        },
        parseValue(value: any) {
          return value ? new Date(value as any) : null;
        },
        parseLiteral(ast) {
          return ast.kind === Kind.STRING ? new Date(ast.value) : null;
        },
      }),
      JSON: new GraphQLScalarType({
        name: 'JSON',
        serialize(value: any) { return value; },
        parseValue(value: any) { return value; },
        parseLiteral(ast) {
          switch (ast.kind) {
            case Kind.STRING: return ast.value;
            case Kind.INT: return parseInt(ast.value, 10);
            case Kind.FLOAT: return parseFloat(ast.value);
            case Kind.BOOLEAN: return ast.value === 'true';
            case Kind.NULL: return null;
            case Kind.LIST: return (ast.values || []).map((v: any) => (v.value ?? null));
            case Kind.OBJECT:
              const obj: any = {};
              for (const field of ast.fields || []) obj[field.name.value] = (field.value as any)?.value ?? null;
              return obj;
            default: return null;
          }
        },
      }),
    },
    applicationsResolver,
    interviewsResolver,
    companiesResolver,
    contactsResolver,
    documentsResolver,
    analyticsResolver,
  ],
});

export async function createApolloServer(expressApp: Express, httpServer: Server) {
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();

  expressApp.use('/graphql', optionalAuth, async (req, res, next) => {
    if (req.method === 'POST') {
      const userId = getUserIdFromRequest(req) || 'test-user-id';

      try {
        const parsedBody = (req as any).body;
        const body = parsedBody && typeof parsedBody === 'object'
          ? parsedBody
          : await new Promise<{
              query: string;
              variables?: Record<string, unknown>;
              operationName?: string;
            }>((resolve, reject) => {
              let data = '';
              req.on('data', (chunk) => {
                data += chunk;
              });
              req.on('end', () => {
                try {
                  resolve(JSON.parse(data || '{}'));
                } catch (e) {
                  reject(e);
                }
              });
            });

        const result = await server.executeOperation(
          {
            query: body.query,
            variables: body.variables,
            operationName: body.operationName,
          },
          {
            contextValue: { userId },
          }
        );

        const single = (result as any)?.body?.singleResult ?? result;
        res.status(200).json(single);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    } else if (req.method === 'GET') {
      const host = req.get('host');
      const endpoint = `http://${host}/graphql`;
      const sandboxUrl = `https://studio.apollographql.com/sandbox?endpoint=${encodeURIComponent(endpoint)}`;
      res.redirect(302, sandboxUrl);
    } else {
      next();
    }
  });
}
