const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testServer() {
  console.log('🧪 Testing Insightify Server...\n');

  try {
    // Test 1: Server health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');

    // Test 2: User registration
    console.log('2. Testing user registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
      console.log('✅ User registered successfully');
      const token = registerResponse.data.data.token;
      console.log('');

      // Test 3: Get user profile
      console.log('3. Testing user profile...');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User profile retrieved:', profileResponse.data.data.name);
      console.log('');

      // Test 4: Create project
      console.log('4. Testing project creation...');
      const projectData = {
        name: 'Test API Project',
        description: 'A test project for analytics',
        domains: ['api.example.com'],
        tags: ['test', 'api']
      };
      
      const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Project created successfully');
      const projectId = projectResponse.data.data._id;
      const apiKey = projectResponse.data.data.apiKey;
      console.log('API Key:', apiKey);
      console.log('');

      // Test 5: Test analytics tracking
      console.log('5. Testing analytics tracking...');
      const analyticsResponse = await axios.post(`${BASE_URL}/api/analytics/track`, {
        route: { path: '/test', method: 'GET' },
        request: { ip: '127.0.0.1', userAgent: 'Test Agent' },
        response: { statusCode: 200 },
        performance: { responseTime: 150 }
      }, {
        headers: { 'X-API-Key': apiKey }
      });
      console.log('✅ Analytics tracked successfully');
      console.log('');

      // Test 6: Get project stats
      console.log('6. Testing project statistics...');
      const statsResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Project stats retrieved:', {
        totalRequests: statsResponse.data.data.totalRequests,
        errorCount: statsResponse.data.data.errorCount,
        avgResponseTime: statsResponse.data.data.avgResponseTime
      });
      console.log('');

      console.log('🎉 All tests passed! Server is working correctly.');

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️ User already exists, trying login instead...');
        
        // Try login instead
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'password123'
        });
        console.log('✅ Login successful');
        const token = loginResponse.data.data.token;
        
        // Continue with project creation test...
        console.log('4. Testing project creation...');
        const projectData = {
          name: 'Test API Project',
          description: 'A test project for analytics',
          domains: ['api.example.com'],
          tags: ['test', 'api']
        };
        
        const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Project created successfully');
        const projectId = projectResponse.data.data._id;
        const apiKey = projectResponse.data.data.apiKey;
        console.log('API Key:', apiKey);
        console.log('');

        console.log('🎉 Server is working correctly!');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run tests
testServer();
