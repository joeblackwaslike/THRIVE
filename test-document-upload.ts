// Test document upload functionality
// This script tests the complete authentication and document upload flow

interface GraphQLResponse {
  data?: {
    documents?: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    createDocument?: {
      id: string;
      name: string;
      type: string;
      fileUrl: string;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

console.log('=== DOCUMENT UPLOAD TEST ===');

// Check authentication status
const token = localStorage.getItem('supabase-auth-token');
const userId = localStorage.getItem('user-id');

console.log('Authentication status:');
console.log('- Token exists:', !!token);
console.log('- User ID:', userId);

if (!token) {
  console.log('❌ No authentication token found. Please log in first.');
  console.log('=== TEST FAILED ===');
} else {
  console.log('✅ Authentication token found');

  // Test GraphQL connection
  fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-User-Id': userId || '',
    },
    body: JSON.stringify({
      query: `
        query {
          documents {
            id
            name
            type
          }
        }
      `,
    }),
  })
    .then((response) => response.json())
    .then((data: GraphQLResponse) => {
      console.log('✅ GraphQL connection successful');
      console.log('Documents count:', data.data?.documents?.length || 0);

      // Test document creation
      console.log('Testing document creation...');
      return fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({
          query: `
          mutation CreateTestDocument($input: DocumentInput!) {
            createDocument(input: $input) {
              id
              name
              type
              fileUrl
            }
          }
        `,
          variables: {
            input: {
              name: 'Test Document',
              type: 'resume',
              fileName: 'test.pdf',
              fileUrl:
                'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KSGVsbG8gV29ybGQhCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNQplbmRvYmoKCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOCAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNzggMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA0Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxOTcKJSVFT0YK',
              fileSize: 1024,
              mimeType: 'application/pdf',
              version: 1,
            },
          },
        }),
      });
    })
    .then((response) => response.json())
    .then((data: GraphQLResponse) => {
      if (data.errors) {
        console.log('❌ Document creation failed:', data.errors);
        console.log('=== TEST FAILED ===');
      } else {
        console.log('✅ Document creation successful!');
        console.log('Created document:', data.data?.createDocument);
        console.log('=== TEST PASSED ===');
      }
    })
    .catch((error: Error) => {
      console.log('❌ Test failed with error:', error);
      console.log('=== TEST FAILED ===');
    });
}
